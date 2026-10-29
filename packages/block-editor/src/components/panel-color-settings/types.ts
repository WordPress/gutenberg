import type {
	ColorGradientSetting,
	PanelColorGradientSettingsProps,
} from '../colors-gradients/types';

/**
 * A color setting of `PanelColorSettings`.
 */
export interface PanelColorSetting extends Omit<
	ColorGradientSetting,
	'onColorChange' | 'colorValue'
> {
	value?: string;
	onChange?: ColorGradientSetting[ 'onColorChange' ];
}

/**
 * Props of `PanelColorSettings`.
 */
export interface PanelColorSettingsProps extends Omit<
	PanelColorGradientSettingsProps,
	'settings'
> {
	colorSettings: PanelColorSetting[];
}
