import { S_AstryxMain } from "./main";

namespace ServerToClient {
	export interface Remotes {}
	export interface Functions {}
}

namespace ClientToServer {
	export interface Remotes {}
	export interface Functions {}
}

export const GlobalSignals = S_AstryxMain.Network.make_signals<ServerToClient.Remotes, ClientToServer.Remotes>();
export const GlobalFunctions = S_AstryxMain.Network.make_remote_functions<
	ServerToClient.Functions,
	ClientToServer.Functions
>();
