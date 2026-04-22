import { Astryx } from ".";

namespace ServerToClient {
	export interface Remotes {}
	export interface Functions {}
}

namespace ClientToServer {
	export interface Remotes {}
	export interface Functions {}
}

export const GlobalSignals = Astryx.Network.make_signals<ServerToClient.Remotes, ClientToServer.Remotes>();
export const GlobalFunctions = Astryx.Network.make_remote_functions<
	ServerToClient.Functions,
	ClientToServer.Functions
>();
