export namespace AstryxUi {
	export interface Theme {
		primary_color: Color3;
		secondary_color: Color3;

		per_object_theming?: { [key in keyof typeof ObjectTypes]: Instance[] };
	}

	export enum ObjectTypes {
		TextButton,
	}

	export namespace Props {
		export interface UiBase {
			theme?: Theme;
			children?: Instance[];
		}

		export interface ButtonProps extends UiBase {
			text?: string;
			image?: string;
		}
	}
}
