import { I_Lifecycle } from "shared/core/types";
import { C_Singleton } from ".";
import { T_Astryx } from "shared";

export class C_Controller extends C_Singleton implements I_Lifecycle {
	constructor(protected engine: T_Astryx) {
		super();
	}

	OnInit(): void {}
}
