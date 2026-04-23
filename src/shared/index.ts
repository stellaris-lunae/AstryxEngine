import { ReplicatedStorage, RunService } from "@rbxts/services";
import S_AstryxLogger from "./logging";
import Signal from "@rbxts/signal";
import { C_Component } from "./components";
import { C_Error, C_Result, C_Success } from "./result";
import { C_Singleton } from "./singleton";
import { C_Controller } from "./singleton/controller";
import { C_Service } from "./singleton/service";
import { t } from "@rbxts/t";
import { AstryxUserInterface } from "./ui";
import { Network } from "./network";

/** dying schizophrenic delusions of a C++ dev making a roblox game engine without a TS transformer* **/
/** typescript transformer is in the works though 🤫 **/

type T_NetworkSignalMap<S, C> = {
	[K in keyof (S & C)]: (S & C)[K] extends (...args: infer A extends unknown[]) => void ? Network.C_Signal<A> : never;
};

type T_NetworkFunctionMap<S, C> = {
	[K in keyof (S & C)]: (S & C)[K] extends (...args: infer A extends unknown[]) => void
		? Network.C_Function<A>
		: never;
};

class C_AstryxMain {
	log_info = S_AstryxLogger.log_info;
	log_warn = S_AstryxLogger.log_warn;
	log_error = S_AstryxLogger.log_error;

	static NETWORK_FOLDER = (() => {
		let ret: Folder;

		const network_name = `ASTRYX.NETWORK`;

		if (RunService.IsServer()) {
			const net = ReplicatedStorage.FindFirstChild(network_name);
			if (!net) {
				ret = new Instance("Folder");
				ret.Name = network_name;
				ret.Parent = ReplicatedStorage;
			} else {
				ret = net as Folder;
			}
		} else {
			ret = ReplicatedStorage.WaitForChild(network_name) as Folder;
		}

		return ret;
	})();

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
		components: Array<[instance: Instance, components: Array<C_Component>]> = [];
		singletons: Array<C_Singleton> = [];
	};

	/** @hidden */
	C_Network = class {
		constructor() {}

		/**
		 * makes signals by types
		 *
		 * @param ServerShenanigans server shite to make
		 * @param ClientShenanigans blah blah blah you know the deal
		 */
		make_signals<S, C>(): T_NetworkSignalMap<S, C> {
			S_AstryxLogger.log_info("make_signals called");

			const cache = new Map<string, Network.C_Signal<unknown[]>>();
			const get_or_create = (key: unknown): Network.C_Signal<unknown[]> => {
				if (!t.string(key)) {
					error(`make_signals expected string key, got ${typeOf(key)}`);
				}

				if (!cache.has(key)) {
					S_AstryxLogger.log_info(`make_signals: creating signal for "${key}"`);
					cache.set(key, new Network.C_Signal(key, C_AstryxMain.NETWORK_FOLDER));
				} else {
					S_AstryxLogger.log_info(`make_signals: reusing signal for "${key}"`);
				}
				return cache.get(key)!;
			};

			return setmetatable({} as T_NetworkSignalMap<S, C>, {
				__index: (_self: unknown, key: unknown) => get_or_create(key),
			}) as T_NetworkSignalMap<S, C>;
		}

		make_remote_functions<S, C>(): T_NetworkFunctionMap<S, C> {
			S_AstryxLogger.log_info("make_remote_functions called");

			const cache = new Map<string, Network.C_Function<unknown[]>>();
			const get_or_create = (key: string): Network.C_Function<unknown[]> => {
				if (!cache.has(key)) {
					S_AstryxLogger.log_info(`make_signals: creating signal for "${key}"`);
					cache.set(key, new Network.C_Function(key, C_AstryxMain.NETWORK_FOLDER));
				} else {
					S_AstryxLogger.log_info(`make_signals: reusing signal for "${key}"`);
				}
				return cache.get(key) as Network.C_Function<unknown[]>;
			};

			return setmetatable({} as T_NetworkFunctionMap<S, C>, {
				__index: (_self: unknown, key: unknown) => get_or_create(key as string),
			}) as T_NetworkFunctionMap<S, C>;
		}
	};

	/** @hidden */
	C_Engine = class {
		private engine: C_AstryxMain;

		constructor(engine: C_AstryxMain) {
			this.engine = engine;
		}

		Dawn(dawn_options: {
			components_folder?: Folder;
			services_folder?: Folder;
			controller_folder?: Folder;
		}): Promise<C_Result | C_AstryxMain> {
			// common setup
			const dawn_trace = debug.traceback("", 2).gsub("^%s+", "")[0].split("\n")[0];
			S_AstryxLogger.log_info(`Dawn() called on ${RunService.IsClient() ? "clih" : "slih"}: > ${dawn_trace}`);

			if (RunService.IsClient()) {
				if (C_AstryxMain.intialized_buffers.client_dawn) {
					S_AstryxLogger.log_error("Dawn() already called on client side, and just got called again");
					return Promise.reject("Double-call of Dawn()") as Promise<C_Error>;
				}

				if (dawn_options.services_folder)
					S_AstryxLogger.log_warn(
						`Dawn({}.services_folder) is being used on the client: > ${debug.traceback("", 2).gsub("^%s+", "")[0]}`,
					);

				if (!dawn_options.controller_folder) {
					S_AstryxLogger.log_warn("bro where the fuck is your controller folder(client), im leaving.");
					return Promise.reject(new C_Error("no controller_folder in client's dawn")) as Promise<C_Result>;
				}

				const timeprecontroller = os.clock();
				dawn_options.controller_folder.GetDescendants().forEach((controller_script) => {
					if (controller_script.IsA("ModuleScript")) {
						const script_class = require(controller_script) as new (e: T_Astryx) => C_Controller;
						const new_controller = new script_class(Astryx);

						if (!(new_controller instanceof C_Controller)) {
							S_AstryxLogger.log_info(`${controller_script.Name} not instance of C_Controller`);
							return Promise.reject(new C_Error("script in controller wasn't instance of controller"));
						}

						S_AstryxLogger.log_info(`Made controller ${controller_script.Name}!`);
						const lifecycle = new_controller as unknown as I_Lifecycle;
						if (lifecycle.OnInit !== undefined) {
							lifecycle.OnInit();
							S_AstryxLogger.log_info(`Called ${controller_script.Name}.OnInit()`);
						}

						task.spawn(() => {
							if (lifecycle.OnStart !== undefined) {
								lifecycle.OnStart();

								S_AstryxLogger.log_info(`Called ${controller_script.Name}.OnStart()`);
							}
							if (lifecycle.OnRender !== undefined) {
								RunService.RenderStepped.Connect((dt) => lifecycle.OnRender?.(dt));
								S_AstryxLogger.log_info(
									`Hooked ${controller_script.Name}.OnRender() into RenderStepped`,
								);
							}
							if (lifecycle.OnTick !== undefined) {
								RunService.Heartbeat.Connect((dt) => lifecycle.OnTick?.(dt));
								S_AstryxLogger.log_info(`Hooked ${controller_script.Name}.OnTick() into Heartbeat`);
							}

							this.engine.INTERNAL.singletons.push(new_controller);
						});
					} else {
						S_AstryxLogger.log_info(
							`non module script found in controller folder, skipping`,
						);
					}
				});
				const timepostcontroller = os.clock();

				S_AstryxLogger.log_bypass_info(
					`intializing controllers took ${math.floor((timepostcontroller - timeprecontroller) * 1000)}ms`,
				);

				C_AstryxMain.intialized_buffers.client_dawn = true;
				return Promise.resolve(this.engine);
			} else {
				if (C_AstryxMain.intialized_buffers.server_dawn) {
					S_AstryxLogger.log_error("Dawn() already called on server side, and just got called again");
					return Promise.reject("Double-call of Dawn()") as Promise<C_Error>;
				}

				if (!dawn_options.services_folder) {
					S_AstryxLogger.log_warn("bro where the fuck is your services folder(server), im leaving.");
					return Promise.reject(new C_Error("no services_folder in server's dawn")) as Promise<C_Result>;
				}

				if (dawn_options.controller_folder)
					S_AstryxLogger.log_warn(
						`Dawn({}.controller_folder) is being used on the server: > ${debug.traceback("", 2).gsub("^%s+", "")[0]}`,
					);

				const timepreservice = os.clock();
				dawn_options.services_folder.GetChildren().forEach((service_script) => {
					if (service_script.IsA("ModuleScript")) {
						const script_class = require(service_script) as new (e: T_Astryx) => C_Service;
						const new_controller = new script_class(Astryx);

						if (!(new_controller instanceof C_Service)) {
							S_AstryxLogger.log_info(`${service_script.Name} not instance of C_Service`);
							return Promise.reject(new C_Error("script in serivce wasn't instance of service :("));
						}

						S_AstryxLogger.log_info(`Made service ${service_script.Name}!`);
						const lifecycle = new_controller as unknown as I_Lifecycle;
						if (lifecycle.OnInit !== undefined) {
							lifecycle.OnInit();
							S_AstryxLogger.log_info(`Called ${service_script.Name}.OnInit()`);
						}

						task.spawn(() => {
							if (lifecycle.OnStart !== undefined) {
								lifecycle.OnStart();

								S_AstryxLogger.log_info(`Called ${service_script.Name}.OnStart()`);
							}
							if (lifecycle.OnRender !== undefined) {
								S_AstryxLogger.log_error(
									`are you fucking stupid, ${service_script.Name} just called OnRender. go fuck yourself.`,
								);
							}
							if (lifecycle.OnTick !== undefined) {
								RunService.Heartbeat.Connect((dt) => lifecycle.OnTick?.(dt));
								S_AstryxLogger.log_info(`Hooked ${service_script.Name}.OnTick() into Heartbeat`);
							}

							this.engine.INTERNAL.singletons.push(new_controller);
						});
					} else {
						S_AstryxLogger.log_info(
							`non module script found in service folder, ignoring`,
						);
					}
				});
				const timepostservice = os.clock();

				S_AstryxLogger.log_bypass_info(
					`intializing services took ${math.floor((timepostservice - timepreservice) * 1000)}ms`,
				);

				C_AstryxMain.intialized_buffers.server_dawn = true;
				return Promise.resolve(this.engine);
			}
		}
	};

	/** @hidden */
	C_Components = class {
		private engine: C_AstryxMain;

		constructor(engine: C_AstryxMain) {
			this.engine = engine;
		}

		get_component<T extends C_Component>(instance: Instance): Promise<T | undefined> {
			const entry = this.engine.INTERNAL.components.find(([inst]) => inst === instance);
			return Promise.resolve(entry?.[1][0] as T | undefined);
		}
	};

	/** please dont touch this var unless you are really sure that you want to fuck up my spaghetti code **/
	INTERNAL = new this.C_INTERNAL();

	Engine = new this.C_Engine(this);
	Network = new this.C_Network();
	Components = new this.C_Components(this);

	UI = new AstryxUserInterface();
}

export type T_Astryx = {
	INTERNAL: InstanceType<C_AstryxMain["C_INTERNAL"]>;
	Engine: InstanceType<C_AstryxMain["C_Engine"]>;
	Network: InstanceType<C_AstryxMain["C_Network"]>;
	Components: InstanceType<C_AstryxMain["C_Components"]>;

	UI: AstryxUserInterface;
};

export const Astryx = new C_AstryxMain();