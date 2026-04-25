import { Players, ReplicatedStorage, RunService } from "@rbxts/services";
import { t } from "@rbxts/t";
import S_AstryxLogger from "shared/core/logging";

export namespace Network {
	export const NETWORK_FOLDER: Folder = (() => {
		let ret: Folder;

		const network_name = "astryx.network";

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

	export const INTERNAL_NETWORK_FOLDER: Folder = (() => {
		let ret: Folder;

		const network_name = "astryx.internal.network";

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

	type T_NetworkSignalMap<S, C> = {
		[K in keyof (S & C)]: (S & C)[K] extends (...args: infer A extends unknown[]) => void ? C_Signal<A> : never;
	};

	type T_NetworkFunctionMap<S, C> = {
		[K in keyof (S & C)]: (S & C)[K] extends (...args: infer A extends unknown[]) => void ? C_Function<A> : never;
	};

	/**
	 * signal
	 */
	export function make_signals<S, C>(): T_NetworkSignalMap<S, C> {
		S_AstryxLogger.log_info("make_signals called");

		const cache = new Map<string, C_Signal<unknown[]>>();
		const get_or_create = (key: unknown): C_Signal<unknown[]> => {
			if (!t.string(key)) {
				error(`make_signals expected string key, got ${typeOf(key)}`);
			}

			if (!cache.has(key)) {
				S_AstryxLogger.log_info(`make_signals: creating signal for "${key}"`);
				cache.set(key, new C_Signal(key, NETWORK_FOLDER));
			} else {
				S_AstryxLogger.log_info(`make_signals: reusing signal for "${key}"`);
			}
			return cache.get(key)!;
		};

		return setmetatable({} as T_NetworkSignalMap<S, C>, {
			__index: (_self: unknown, key: unknown) => get_or_create(key),
		}) as T_NetworkSignalMap<S, C>;
	}

	/**
	 * signal
	 * @hidden
	 */
	export function make_internal_signals<S, C>(): T_NetworkSignalMap<S, C> {
		S_AstryxLogger.log_info("make_signals called");

		const cache = new Map<string, C_Signal<unknown[]>>();
		const get_or_create = (key: unknown): C_Signal<unknown[]> => {
			if (!t.string(key)) {
				error(`make_signals expected string key, got ${typeOf(key)}`);
			}

			if (!cache.has(key)) {
				S_AstryxLogger.log_info(`make_signals: creating signal for "${key}"`);
				cache.set(key, new C_Signal(key, INTERNAL_NETWORK_FOLDER));
			} else {
				S_AstryxLogger.log_info(`make_signals: reusing signal for "${key}"`);
			}
			return cache.get(key)!;
		};

		return setmetatable({} as T_NetworkSignalMap<S, C>, {
			__index: (_self: unknown, key: unknown) => get_or_create(key),
		}) as T_NetworkSignalMap<S, C>;
	}

	/**
	 * remote functiosn wow!
	 */
	export function make_remote_functions<S, C>(): T_NetworkFunctionMap<S, C> {
		S_AstryxLogger.log_info("make_remote_functions called");

		const cache = new Map<string, C_Function<unknown[]>>();
		const get_or_create = (key: string): C_Function<unknown[]> => {
			if (!cache.has(key)) {
				S_AstryxLogger.log_info(`make_remote_functions: creating function for "${key}"`);
				cache.set(key, new C_Function(key, NETWORK_FOLDER));
			} else {
				S_AstryxLogger.log_info(`make_remote_functions: reusing function for "${key}"`);
			}
			return cache.get(key) as C_Function<unknown[]>;
		};

		return setmetatable({} as T_NetworkFunctionMap<S, C>, {
			__index: (_self: unknown, key: unknown) => get_or_create(key as string),
		}) as T_NetworkFunctionMap<S, C>;
	}

	export class C_Signal<A extends unknown[]> {
		private remote: RemoteEvent | undefined;
		private readonly name: string;
		private readonly folder: Folder;

		constructor(name: string, folder: Folder) {
			this.name = name;
			this.folder = folder;

			if (RunService.IsServer()) {
				const existing = folder.FindFirstChild(name);
				this.remote =
					existing !== undefined
						? (existing as RemoteEvent)
						: (() => {
								const r = new Instance("RemoteEvent");
								r.Name = name;
								r.Parent = folder;
								return r;
							})();
			}
			S_AstryxLogger.log_info(`C_NetworkSignal: initialized remote "${name}"`);
		}

		private get_remote(): RemoteEvent {
			if (this.remote) {
				return this.remote;
			}

			const existing = this.folder.FindFirstChild(this.name);
			this.remote = existing ? (existing as RemoteEvent) : (this.folder.WaitForChild(this.name) as RemoteEvent);

			return this.remote;
		}

		connect_server(callback: (player: Player, ...args: A) => void): RBXScriptConnection {
			return this.get_remote().OnServerEvent.Connect(callback as (player: Player, ...args: unknown[]) => void);
		}

		connect_client(callback: (...args: A) => void): RBXScriptConnection {
			return this.get_remote().OnClientEvent.Connect(callback as (...args: unknown[]) => void);
		}

		fire_to_client(player: Player, ...args: A): void {
			this.get_remote().FireClient(player, ...args);
		}

		fire_to_all_except_client(player: Player, ...args: A): void {
			Players.GetPlayers()
				.filter((p) => p !== player)
				.forEach((p) => this.get_remote().FireClient(p, ...args));
		}

		fire_to_all_clients(...args: A): void {
			this.get_remote().FireAllClients(...args);
		}

		fire_to_server(...args: A): void {
			this.get_remote().FireServer(...args);
		}
	}

	export class C_Function<A extends unknown[]> {
		private func: RemoteFunction | undefined;
		private readonly name: string;
		private readonly folder: Folder;

		constructor(name: string, folder: Folder) {
			this.name = name;
			this.folder = folder;

			if (RunService.IsServer()) {
				const existing = folder.FindFirstChild(name);
				this.func =
					existing !== undefined
						? (existing as RemoteFunction)
						: (() => {
								const r = new Instance("RemoteFunction");
								r.Name = name;
								r.Parent = folder;
								return r;
							})();
			}
			S_AstryxLogger.log_info(`C_NetworkSignal: initialized remote "${name}"`);
		}

		private get_func(): RemoteFunction {
			if (this.func) {
				return this.func;
			}

			const existing = this.folder.FindFirstChild(this.name);
			this.func = existing
				? (existing as RemoteFunction)
				: (this.folder.WaitForChild(this.name) as RemoteFunction);

			return this.func;
		}

		connect_server(callback: (player: Player, ...args: A) => void) {
			this.get_func().OnServerInvoke = callback as (player: Player, ...args: unknown[]) => void;
		}

		connect_client(callback: (...args: A) => void) {
			this.get_func().OnClientInvoke = callback as (...args: unknown[]) => void;
		}

		invoke_client(player: Player, ...args: A): void {
			this.get_func().InvokeClient(player, ...args);
		}

		invoke_all_except_client(player: Player, ...args: A): void {
			Players.GetPlayers()
				.filter((p) => p !== player)
				.forEach((p) => this.get_func().InvokeClient(p, ...args));
		}

		fire_to_server(...args: A): void {
			this.get_func().InvokeServer(...args);
		}
	}
}
