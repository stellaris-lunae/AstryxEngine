import { I_Lifecycle } from "shared/core/types";

export type T_ComponentTagObject = {
	tag: string;
};

export class C_Component implements I_Lifecycle {
	static tag_object: T_ComponentTagObject = {
		tag: "",
	};

	constructor(
		protected instance: Instance,
		public readonly tag_object: T_ComponentTagObject,
	) {}

	OnInit(): void {}
}

export type T_ComponentClass<T extends C_Component = C_Component> = {
	new (instance: Instance, tag_object: T_ComponentTagObject): T;
	tag_object: T_ComponentTagObject;
};
