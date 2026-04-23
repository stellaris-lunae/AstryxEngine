import { Players, ReplicatedStorage, RunService } from "@rbxts/services";
import { t } from "@rbxts/t";
import S_AstryxLogger from "shared/logging";

export namespace Network {
	export const NETWORK_FOLDER: Folder = (() => {
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
		private remote: RemoteEvent;

		constructor(name: string, folder: Folder) {
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
			} else {
				this.remote = folder.WaitForChild(name) as RemoteEvent;
			}
			S_AstryxLogger.log_info(`C_NetworkSignal: initialized remote "${name}"`);
		}

		connect_server(callback: (player: Player, ...args: A) => void): RBXScriptConnection {
			return this.remote.OnServerEvent.Connect(callback as (player: Player, ...args: unknown[]) => void);
		}

		connect_client(callback: (...args: A) => void): RBXScriptConnection {
			return this.remote.OnClientEvent.Connect(callback as (...args: unknown[]) => void);
		}

		fire_to_client(player: Player, ...args: A): void {
			this.remote.FireClient(player, ...args);
		}

		fire_to_all_except_client(player: Player, ...args: A): void {
			Players.GetPlayers()
				.filter((p) => p !== player)
				.forEach((p) => this.remote.FireClient(p, ...args));
		}

		fire_to_all_clients(...args: A): void {
			this.remote.FireAllClients(...args);
		}

		fire_to_server(...args: A): void {
			this.remote.FireServer(...args);
		}
	}

	export class C_Function<A extends unknown[]> {
		private func: RemoteFunction;

		constructor(name: string, folder: Folder) {
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
			} else {
				this.func = folder.WaitForChild(name) as RemoteFunction;
			}
			S_AstryxLogger.log_info(`C_NetworkSignal: initialized remote "${name}"`);
		}

		connect_server(callback: (player: Player, ...args: A) => void) {
			this.func.OnServerInvoke = callback as (player: Player, ...args: unknown[]) => void;
		}

		connect_client(callback: (...args: A) => void) {
			this.func.OnClientInvoke = callback as (...args: unknown[]) => void;
		}

		invoke_client(player: Player, ...args: A): void {
			this.func.InvokeClient(player, ...args);
		}

		invoke_all_except_client(player: Player, ...args: A): void {
			Players.GetPlayers()
				.filter((p) => p !== player)
				.forEach((p) => this.func.InvokeClient(p, ...args));
		}

		fire_to_server(...args: A): void {
			this.func.InvokeServer(...args);
		}
	}
}
