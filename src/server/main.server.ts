import { Astryx } from "shared";

Astryx.Engine.Dawn({
	components_folder: script.Parent?.FindFirstChild("components") as Folder,
	shared_components_folder: script.Parent as Folder,
	services_folder: script.Parent?.FindFirstChild("services") as Folder,
}).then((r) => {});
