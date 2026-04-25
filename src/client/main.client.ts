import { Astryx } from "shared";

Astryx.Engine.Dawn({
	components_folder: script.Parent?.FindFirstChild("components") as Folder,
	controller_folder: script.Parent?.FindFirstChild("controller") as Folder,
}).then((r) => {});
