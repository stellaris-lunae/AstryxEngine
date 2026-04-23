import { Players, RunService } from "@rbxts/services";
import S_AstryxLogger from "shared/logging";

export namespace Network {
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
