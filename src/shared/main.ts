import { ReplicatedStorage, RunService } from "@rbxts/services";
import S_AstryxLogger from "./logging";
import Signal from "@rbxts/signal";
import { Network } from "./network";
import { C_Component } from "./components";
import { C_Controller } from "./components/controller";
import { C_Service } from "./components/service";
import { C_Error, C_Result, C_Success } from "./result";

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

		if (RunService.IsServer()) {
			const net = ReplicatedStorage.FindFirstChild("NETWORK_ASTRYX");
			if (!net) {
				ret = new Instance("Folder");
				ret.Name = "NETWORK_ASTRYX";
				ret.Parent = ReplicatedStorage;
			} else {
				ret = net as Folder;
			}
		} else {
			ret = ReplicatedStorage.WaitForChild("NETWORK_ASTRYX") as Folder;
		}

		return ret;
	})();

	static intialized_buffers = {
		components: false,
	};

	fully_intialized = () => {
		let ret = false;

		for (let [x, y] of pairs(C_AstryxMain.intialized_buffers)) {
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
			const get_or_create = (key: string): Network.C_Signal<unknown[]> => {
				if (!cache.has(key)) {
					S_AstryxLogger.log_info(`make_signals: creating signal for "${key}"`);
					cache.set(key, new Network.C_Signal(key, C_AstryxMain.NETWORK_FOLDER));
				} else {
					S_AstryxLogger.log_info(`make_signals: reusing signal for "${key}"`);
				}
				return cache.get(key) as Network.C_Signal<unknown[]>;
			};

			return setmetatable({} as T_NetworkSignalMap<S, C>, {
				__index: (_self: unknown, key: unknown) => get_or_create(key as string),
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

		constructor() {
			this.engine = S_AstryxMain;
		}

		Dawn(setupOpt: {
			componentsFolder?: Folder;
			services_folder?: Folder;
			controllerFolder?: Folder;
		}): Promise<C_Result> {
			// common setup

			if (RunService.IsClient()) {
				if (setupOpt.services_folder)
					S_AstryxLogger.log_warn(
						`Dawn({}.services_folder) is being used on the client: \n> ${debug.traceback("", 2).gsub("^%s+", "")[0]}`,
					);

				if (!setupOpt.controllerFolder) {
					S_AstryxLogger.log_warn("bro where the fuck is your controller folder, im leaving.");
					return Promise.reject(new C_Error("failed to find controller folder")) as Promise<C_Result>;
				}

				return Promise.resolve(new C_Success("client ok"));
			} else {
				return Promise.resolve(new C_Success("server ok"));
			}
		}
	};

	/** @hidden */
	C_Components = class {
		private engine: C_AstryxMain;

		constructor() {
			this.engine = S_AstryxMain;
		}

		get_component<T extends C_Component>(instance: Instance): Promise<T | undefined> {
			const entry = this.engine.INTERNAL.components.find(([inst]) => inst === instance);
			return Promise.resolve(entry?.[1][0] as T | undefined);
		}
	};

	/** please dont touch this unless you are really sure that you want to fuck up my spaghetti code **/
	INTERNAL = new this.C_INTERNAL();

	Engine = new this.C_Engine();
	Network = new this.C_Network();
	Components = new this.C_Components();
}

export const S_AstryxMain = new C_AstryxMain();
