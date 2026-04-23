import { RunService } from "@rbxts/services";
import { AstryxUi } from "./type";
import S_AstryxLogger from "shared/logging";
import { _INTERNAL_AstryxNetwork_Signal } from "shared/network/internal";

/** @hidden */
export class AstryxUserInterface {
	static CurrentTheme: AstryxUi.Theme = {
		primary_color: Color3.fromRGB(255, 255, 255),
		secondary_color: Color3.fromRGB(0, 0, 0),
	};

	set_theme(newTheme: AstryxUi.Theme) {
		if (!RunService.IsServer()) {
			S_AstryxLogger.log_error("set_theme called on client go fuck yourself(this is tba)");
			return;
		}

		AstryxUserInterface.CurrentTheme = newTheme;
		_INTERNAL_AstryxNetwork_Signal.ThemeUpdate.fire_to_all_clients(newTheme);
	}

	button(props: AstryxUi.Props.ButtonProps) {
		if (props.text && props.image) {
			const traceback = debug.traceback("", 2).gsub("^%s+", "")[0].split("\n")[0];
			S_AstryxLogger.log_info(`${traceback} passed in both props.image and props.image`);
			return;
		}

		if (props.text) {
			const newTextButton: TextButton = new Instance("TextButton");
			newTextButton.Text = props.text;
		}
	}

	private apply_style(obj: GuiObject) {
		obj.BackgroundColor3 = AstryxUserInterface.CurrentTheme.secondary_color;

		const theming = AstryxUserInterface.CurrentTheme.per_object_theming;
		if (theming) {
			for (const [k, v] of pairs(theming)) {
				if (typeOf(obj) === (k as string))
					v.forEach((v) => {
						v.Clone().Parent = obj;
					});
			}
		}
	}
}
