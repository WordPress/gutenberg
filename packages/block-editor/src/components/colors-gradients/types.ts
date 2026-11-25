import type { ComponentProps, ReactNode } from 'react';
import type {
	ColorPalette,
	GradientPicker,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import type { Palette } from '@wordpress/global-styles-engine';
import type { NoticeProps } from './control';

type ColorPaletteProps = ComponentProps< typeof ColorPalette >;
type ToolsPanelItemProps = ComponentProps< typeof ToolsPanelItem >;

/**
 * A color palette from one origin, i.e. "Core", "Theme" or "User".
 */
export type ColorOrigin = Required<
	Pick< Palette, 'name' | 'slug' | 'colors' >
>;

/**
 * A gradient palette from one origin, i.e. "Core", "Theme" or "User".
 */
export type GradientOrigin = Required<
	Pick< Palette, 'name' | 'slug' | 'gradients' >
>;

/**
 * Color and gradient related settings.
 */
export interface MultipleOriginColorsAndGradients {
	colors: ColorOrigin[];
	gradients: GradientOrigin[];
	disableCustomColors: boolean;
	disableCustomGradients: boolean;
	hasColorsOrGradients: boolean;
}

/**
 * The color and gradient palettes available to pick from.
 */
export interface ColorGradientOptions {
	colors?: ColorPaletteProps[ 'colors' ];
	gradients?: ComponentProps< typeof GradientPicker >[ 'gradients' ];
	disableCustomColors?: boolean;
	disableCustomGradients?: boolean;
	__experimentalIsRenderedInSidebar?: boolean;
	enableAlpha?: boolean;
}

/**
 * Props of `ColorGradientControl`.
 */
export interface ColorGradientControlProps extends ColorGradientOptions {
	className?: string;
	label?: ReactNode;
	onColorChange?: ( color?: string, slug?: string ) => void;
	onGradientChange?: ( gradient?: string, slug?: string ) => void;
	colorValue?: string;
	colorSlug?: string;
	gradientValue?: ComponentProps< typeof GradientPicker >[ 'value' ];
	gradientSlug?: string;
	clearable?: boolean;
	showTitle?: boolean;
	headingLevel?: ColorPaletteProps[ 'headingLevel' ];
	noticeProps?: NoticeProps;
}

/**
 * A color or gradient control rendered by `ColorGradientSettingsDropdown`.
 */
export interface ColorGradientSetting extends ColorGradientControlProps {
	label?: string;
	isShownByDefault?: boolean;
	resetAllFilter?: ToolsPanelItemProps[ 'resetAllFilter' ];
}

/**
 * Props of `ColorGradientSettingsDropdown`. Each item sets its own class name,
 * reset filter and content.
 */
export interface ColorGradientSettingsDropdownProps
	extends
		ColorGradientOptions,
		Partial<
			Omit<
				ToolsPanelItemProps,
				'className' | 'resetAllFilter' | 'children'
			>
		> {
	settings: ColorGradientSetting[];
}

/**
 * Props of `PanelColorGradientSettings`.
 */
export interface PanelColorGradientSettingsProps extends ColorGradientOptions {
	className?: string;
	children?: ReactNode;
	settings: ColorGradientSetting[];
	title?: string;
	showTitle?: boolean;
}
