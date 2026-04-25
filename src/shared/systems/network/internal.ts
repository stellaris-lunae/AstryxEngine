import { Network } from "shared/systems/network";
import { C_Component } from "../component";
import { RunService } from "@rbxts/services";

interface ServerToClient {
	NewSharedComponent(inst: Instance, comp: C_Component): void;
}

interface ClientToServer {}

export const _INTERNAL_AstryxNetwork_Signal = Network.make_internal_signals<ServerToClient, ClientToServer>();

if (RunService.IsServer()) {
	_INTERNAL_AstryxNetwork_Signal.NewSharedComponent;
}
