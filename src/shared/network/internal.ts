import { Astryx } from "shared";
import { AstryxUi } from "shared/ui/type";

interface ServerToClient {
    ThemeUpdate(theme: AstryxUi.Theme): void;
}

interface ClientToServer {

}

/** @hidden */
export const _INTERNAL_AstryxNetwork_Signal = Astryx.Network.make_signals<ServerToClient, ClientToServer>();