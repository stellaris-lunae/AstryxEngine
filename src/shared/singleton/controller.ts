import { I_Lifecycle } from "shared/typing";
import { C_Singleton } from ".";
import { T_AstryxMain } from "shared/main";

export class C_Controller extends C_Singleton implements I_Lifecycle {
    constructor(engine: T_AstryxMain) {
        super()
    }
}
