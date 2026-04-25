import { CollectionService, RunService } from "@rbxts/services";
import S_AstryxLogger from "./core/logging";
import Signal from "@rbxts/signal";
import { C_Component, T_ComponentClass } from "./systems/component";
import { C_Error } from "./core/result";
import { C_Singleton } from "./systems/singleton";
import { C_Controller } from "./systems/singleton/controller";
import { C_Service } from "./systems/singleton/service";
import { Network } from "./systems/network";
import { I_Lifecycle } from "./core/types";
import { _INTERNAL_AstryxNetwork_Signal as _INTERNAL_AstryxNetwork_Signals } from "./systems/network/internal";

type T_DawnOptions = {
	components_folder?: Folder;
	shared_components_folder?: Folder;
	services_folder?: Folder;
	controller_folder?: Folder;
};

/** dying schizophrenic delusions of a C++ dev making a roblox game engine without a TS transformer* **/
/** typescript transformer is in the works though 🤫 **/

class C_AstryxMain {
	log_info = S_AstryxLogger.log_info;
	log_warn = S_AstryxLogger.log_warn;
	log_error = S_AstryxLogger.log_error;

	static intialized_buffers = {
		components: false,
		client_dawn: false,
		server_dawn: false,
	};

	fully_intialized = () => {
		let ret = false;

		for (let [_, y] of pairs(C_AstryxMain.intialized_buffers)) {
			if (y === false) {
				ret = false;
				break;
			} else {
				ret = true;
			}
		}

		return ret;
	};

	constructor() {}

	/** @hidden */
	C_INTERNAL = class {
		conns: Map<string, Signal> = new Map();
		components: Map<Instance, Array<C_Component>> = new Map();
		shared_components: Map<Instance, Array<C_Component>> = new Map();
		singletons: Array<C_Singleton> = [];

		component_folders: {
			server: Folder | undefined;
			client: Folder | undefined;
			shared: Folder | undefined;
		} = {} as {
			server: Folder | undefined;
			client: Folder | undefined;
			shared: Folder | undefined;
		};
	};

	/** @hidden */
	C_Engine = class {
		private engine: C_AstryxMain;

		constructor(engine: C_AstryxMain) {
			this.engine = engine;
		}

		Dawn(dawn_options: T_DawnOptions): Promise<C_Error | C_AstryxMain> {
			const dawn_start = os.clock();
			const is_client = RunService.IsClient();
			const dawn_trace = debug.traceback("", 2).gsub("^%s+", "")[0].split("\n")[0];
			S_AstryxLogger.log_info(`Dawn() called on ${is_client ? "clih" : "slih"}: > ${dawn_trace}`);

			if (is_client) {
				const trace = debug.traceback("", 2).gsub("^%s+", "")[0];
				if (C_AstryxMain.intialized_buffers.client_dawn) {
					S_AstryxLogger.log_error("Dawn() already called on client side, and just got called again");
					return Promise.reject("Double-call of Dawn()") as Promise<C_Error>;
				}

				if (dawn_options.services_folder)
					S_AstryxLogger.log_warn(`Dawn({}.services_folder) is being used on the client: > ${trace}`);

				if (!dawn_options.controller_folder) {
					S_AstryxLogger.log_warn("bro where the fuck is your controller folder(client), im leaving.");
					return Promise.reject(new C_Error("no controller_folder in client's dawn")) as Promise<C_Error>;
				}

				if (!dawn_options.components_folder && !dawn_options.shared_components_folder) {
					S_AstryxLogger.log_warn("bro where the fuck are your component folders(client), im leaving.");
					return Promise.reject(new C_Error("no component folders in client's dawn")) as Promise<C_Error>;
				}

				_INTERNAL_AstryxNetwork_Signals.NewSharedComponent.connect_client((i: Instance, c: C_Component) => {
					const cur_components = this.engine.INTERNAL.shared_components.get(i);
					if (!cur_components) this.engine.INTERNAL.shared_components.set(i, []);

					cur_components?.push(c);
				});
			} else {
				if (C_AstryxMain.intialized_buffers.server_dawn) {
					S_AstryxLogger.log_error("Dawn() already called on server side, and just got called again");
					return Promise.reject("Double-call of Dawn()") as Promise<C_Error>;
				}
				print(dawn_options);
				if (!dawn_options.services_folder) {
					S_AstryxLogger.log_warn("bro where the fuck is your services folder(server), im leaving.");
					return Promise.reject(new C_Error("no services_folder in server's dawn")) as Promise<C_Error>;
				}
				if (dawn_options.controller_folder) {
					S_AstryxLogger.log_warn(
						`Dawn({}.controller_folder) is being used on the server: > ${debug.traceback("", 2).gsub("^%s+", "")[0]}`,
					);
				}
			}

			if (dawn_options.components_folder) {
				this.engine.INTERNAL.component_folders[is_client ? "client" : "server"] =
					dawn_options.components_folder;
				this.engine.Components.intialize_folder(dawn_options.components_folder, false);
			}

			if (dawn_options.shared_components_folder) {
				this.engine.INTERNAL.component_folders.shared = dawn_options.shared_components_folder;
				this.engine.Components.intialize_folder(dawn_options.shared_components_folder, true);
			}

			if (dawn_options.components_folder || dawn_options.shared_components_folder) {
				C_AstryxMain.intialized_buffers.components = true;
			}

			const script_list = is_client
				? dawn_options.controller_folder!.GetDescendants()
				: dawn_options.services_folder!.GetDescendants();
			const timesetupstart = os.clock();

			script_list.forEach((singleton_script) => {
				if (!singleton_script.IsA("ModuleScript")) {
					S_AstryxLogger.log_info(
						`non module script found in ${is_client ? "controller" : "service"} folder, ignoring}`,
					);
					return;
				}

				const script_class = require(singleton_script) as new (e: T_Astryx) => C_Singleton;
				const new_singleton = new script_class(Astryx);

				if (is_client && !(new_singleton instanceof C_Controller)) {
					S_AstryxLogger.log_info(`${singleton_script.Name} not instance of C_Controller`);
					return;
				}
				if (!is_client && !(new_singleton instanceof C_Service)) {
					S_AstryxLogger.log_info(`${singleton_script.Name} not instance of C_Service`);
					return;
				}

				S_AstryxLogger.log_info(`made ${is_client ? "controller" : "service"} ${singleton_script.Name}`);
				const lifecycle = new_singleton as unknown as I_Lifecycle;

				if (lifecycle.OnInit !== undefined) {
					lifecycle.OnInit();
					S_AstryxLogger.log_info(`called ${singleton_script.Name}.OnInit`);
				}

				task.spawn(() => {
					if (lifecycle.OnStart !== undefined) {
						lifecycle.OnStart();
						S_AstryxLogger.log_info(`Called ${singleton_script.Name}.OnStart()`);
					}

					if (lifecycle.OnRender !== undefined) {
						if (is_client) {
							RunService.RenderStepped.Connect((dt) => lifecycle.OnRender?.(dt));
							S_AstryxLogger.log_info(`Hooked ${singleton_script.Name}.OnRender() into RenderStepped`);
						} else {
							S_AstryxLogger.log_error(
								`are you fucking stupid, ${singleton_script.Name} just called OnRender(client call on server). go fuck yourself.`,
							);
						}
					}

					if (lifecycle.OnTick !== undefined) {
						RunService.Heartbeat.Connect((dt) => lifecycle.OnTick?.(dt));
						S_AstryxLogger.log_info(`Hooked ${singleton_script.Name}.OnTick() into Heartbeat`);
					}

					this.engine.INTERNAL.singletons.push(new_singleton);
				});
			});

			const timesetupend = os.clock();
			S_AstryxLogger.log_bypass_info(
				`intializing ${is_client ? "controllers" : "services"} took ${math.floor((timesetupend - timesetupstart) * 1000)}ms`,
			);

			C_AstryxMain.intialized_buffers.client_dawn = is_client
				? true
				: C_AstryxMain.intialized_buffers.client_dawn;
			C_AstryxMain.intialized_buffers.server_dawn = !is_client
				? true
				: C_AstryxMain.intialized_buffers.server_dawn;

			const dawn_end = os.clock();
			S_AstryxLogger.log_bypass_info(
				`Dawn total runtime (${is_client ? "client" : "server"}) took ${math.floor((dawn_end - dawn_start) * 1000)}ms`,
			);

			return Promise.resolve(this.engine);
		}
	};

	/** @hidden */
	C_Components = class {
		private engine: C_AstryxMain;

		constructor(engine: C_AstryxMain) {
			this.engine = engine;
		}

		private get_component_map(use_shared: boolean): Map<Instance, Array<C_Component>> {
			return use_shared ? this.engine.INTERNAL.shared_components : this.engine.INTERNAL.components;
		}

		private has_component_instance<T extends C_Component>(
			components: Array<C_Component> | undefined,
			ctor: T_ComponentClass<T>,
		): boolean {
			let found = false;
			components?.forEach((component) => {
				if (component instanceof ctor) {
					found = true;
				}
			});

			return found;
		}

		private bind_component_to_tag<T extends C_Component>(ctor: T_ComponentClass<T>, use_shared: boolean): void {
			const tag_name = ctor.tag_object.tag;

			CollectionService.GetTagged(tag_name).forEach((instance) => {
				this.add_component(instance, ctor, use_shared);
			});

			CollectionService.GetInstanceAddedSignal(tag_name).Connect((instance) => {
				this.add_component(instance, ctor, use_shared);
			});

			CollectionService.GetInstanceRemovedSignal(tag_name).Connect((instance) => {
				const component_map = this.get_component_map(use_shared);
				component_map.delete(instance);
			});

			S_AstryxLogger.log_info(`bound component script to tag ${tag_name}`);
		}

		private intialize_script(component_script: ModuleScript, use_shared: boolean): void {
			const component_class = require(component_script) as T_ComponentClass;
			const tag_object = component_class.tag_object;

			if (tag_object === undefined || tag_object.tag === undefined || tag_object.tag.size() === 0) {
				S_AstryxLogger.log_warn(
					`${component_script.Name} is missing static tag_object.tag and will not be auto-applied`,
				);
				return;
			}

			this.bind_component_to_tag(component_class, use_shared);
		}

		intialize_folder(folder: Folder, use_shared: boolean): void {
			folder.GetDescendants().forEach((component_script) => {
				if (!component_script.IsA("ModuleScript")) {
					return;
				}

				this.intialize_script(component_script, use_shared);
			});
		}

		get_component<T extends C_Component>(instance: Instance, ctor: T_ComponentClass<T>): Promise<T | undefined> {
			const components = this.engine.INTERNAL.components.get(instance);
			const shared_components = this.engine.INTERNAL.shared_components.get(instance);
			let found_component: T | undefined;

			components?.forEach((c) => {
				if (c instanceof ctor) {
					found_component = c as T;
				}
			});

			shared_components?.forEach((c) => {
				if (c instanceof ctor) {
					found_component = c as T;
				}
			});

			return Promise.resolve(found_component);
		}

		add_component<T extends C_Component>(
			instance: Instance,
			ctor: T_ComponentClass<T>,
			use_shared = false,
		): Promise<T | undefined> {
			const component_map = this.get_component_map(use_shared);
			const current_components = component_map.get(instance);

			if (this.has_component_instance(current_components, ctor)) {
				let found_component: T | undefined;
				current_components?.forEach((component) => {
					if (component instanceof ctor) {
						found_component = component as T;
					}
				});

				return Promise.resolve(found_component);
			}

			const component = new ctor(instance, ctor.tag_object);
			const lifecycle = component as unknown as I_Lifecycle;

			if (current_components) {
				current_components.push(component);
			} else {
				component_map.set(instance, [component]);
			}

			if (lifecycle.OnInit !== undefined) {
				lifecycle.OnInit();
			}

			if (lifecycle.OnStart !== undefined) {
				task.spawn(() => lifecycle.OnStart?.());
			}

			return Promise.resolve(component);
		}
	};

	/** please dont touch this var unless you are really sure that you want to fuck up my spaghetti code **/
	INTERNAL = new this.C_INTERNAL();

	Engine = new this.C_Engine(this);
	Network = Network;
	Components = new this.C_Components(this);
}

export type T_Astryx = {
	INTERNAL: InstanceType<C_AstryxMain["C_INTERNAL"]>;
	Engine: InstanceType<C_AstryxMain["C_Engine"]>;
	Network: typeof Network;
	Components: InstanceType<C_AstryxMain["C_Components"]>;
};

export const Astryx = new C_AstryxMain();
