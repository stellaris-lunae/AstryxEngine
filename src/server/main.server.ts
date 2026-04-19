import { S_AstryxMain } from "shared/main";

S_AstryxMain.Engine.Dawn({
    services_folder: script.Parent as Folder
}).then((r) => {
    print(r.output());
});
