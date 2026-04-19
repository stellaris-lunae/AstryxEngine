import { S_AstryxMain } from "shared/main";

S_AstryxMain.Engine.Dawn({
    controllerFolder: script.Parent as Folder
}).then((r) => {
    print(r.output());
});
