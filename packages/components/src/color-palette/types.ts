/**
 * External dependencies
 */
import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';

type OnColorChange = ( newColor?: string ) => void;

export type ColorObject = {
	name: string;
	color: NonNullable< CSSProperties[ 'color' ] >;
};

export type PaletteObject = {
	name: string;
	colors: ColorObject[];
};

type PaletteProps = {
	className?: string;
	clearColor: () => void;
	onChange: OnColorChange;
	value?: string;
	actions?: ReactNode;
};

export type SinglePaletteProps = PaletteProps & {
	colors: ColorObject[];
};

export type MultiplePalettesProps = PaletteProps & {
	colors: PaletteObject[];
};

export type CustomColorPickerDropdownProps = {
	isRenderedInSidebar: boolean;
	renderContent: () => JSX.Element;
	popoverProps?: string[];
	renderToggle: ( props: {
		isOpen: boolean;
		onToggle: MouseEventHandler< HTMLButtonElement >;
	} ) => JSX.Element;
};

export type ColorPaletteProps = {
	/**
	 * Whether the palette should have a clearing button.
	 */
	clearable?: boolean;
	/**
	 * Classes to be applied to the container.
	 */
	className?: string;
	/**
	 * Array with the colors to be shown.
	 *
	 * @default []
	 */
	colors?: ( PaletteObject | ColorObject )[];
	/**
	 * Whether to allow custom color or not.
	 */
	disableCustomColors?: boolean;
	/**
	 * Whether the color picker should display the alpha channel
	 * both in the bottom inputs as well as in the color picker itself.
	 */
	enableAlpha?: boolean;
	/**
	 * Callback called when a color is selected.
	 */
	onChange: OnColorChange;
	/**
	 * Currently active value.
	 */
	value?: string;
	/**
	 * Whether the colors prop is an array of color palettes,
	 * rather than an array of color objects.
	 */
	__experimentalHasMultipleOrigins?: boolean;
	/**
	 * Whether this is rendered in the sidebar.
	 */
	__experimentalIsRenderedInSidebar?: boolean;
};
