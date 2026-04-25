import { C_Component, T_ComponentTagObject } from "shared/systems/component";

export = class TestComponent extends C_Component {
	static tag_object: T_ComponentTagObject = {
		tag: "test_component",
	};

	constructor(inst: Instance, tag_object: T_ComponentTagObject) {
		super(inst, tag_object);
	}

	OnInit(): void {
		print(`TestComponent attached to ${this.instance.GetFullName()} via tag ${this.tag_object.tag}`);
	}
};
