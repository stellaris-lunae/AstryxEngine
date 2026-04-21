import { Astryx } from "shared/main";

Astryx.Engine.Dawn({
	controller_folder: script.Parent?.FindFirstChild("controller") as Folder,
}).then((r) => {});
