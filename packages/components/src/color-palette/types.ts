/**
 * External dependencies
 */
import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { PopoverProps } from '../popover/types';

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
	/**
	 * Callback called when a color is selected.
	 */
	onChange: ( newColor?: string ) => void;
	value?: string;
	actions?: ReactNode;
};

export type SinglePaletteProps = PaletteProps & {
	colors: ColorObject[];
};

export type MultiplePalettesProps = PaletteProps & {
	colors: PaletteObject[];
};

// TODO: should extend `Dropdown`'s props once it gets refactored to TypeScript
export type CustomColorPickerDropdownProps = {
	isRenderedInSidebar: boolean;
	renderContent: () => ReactNode;
	popoverProps?: Omit< PopoverProps, 'children' >;
	renderToggle: ( props: {
		isOpen: boolean;
		onToggle: MouseEventHandler< HTMLButtonElement >;
	} ) => ReactNode;
};

export type ColorPaletteProps = Pick< PaletteProps, 'onChange' > & {
	/**
	 * Whether the palette should have a clearing button.
	 *
	 * @default true
	 */
	clearable?: boolean;
	/**
	 * Array with the colors to be shown. When displaying multiple color palettes
	 * to choose from, the format of the array changes from an array of colors
	 * objects, to an array of color palettes.
	 *
	 * @default []
	 */
	colors?: ( PaletteObject | ColorObject )[];
	/**
	 * Whether to allow the user to pick a custom color on top of the predefined
	 * choices (defined via the `colors` prop).
	 *
	 * @default false
	 */
	disableCustomColors?: boolean;
	/**
	 * This controls whether the alpha channel will be offered when selecting
	 * custom colors.
	 *
	 * @default false
	 */
	enableAlpha?: boolean;
	/**
	 * Currently active value.
	 */
	value?: string;
	/**
	 * Whether the colors prop is an array of color palettes,
	 * rather than an array of color objects.
	 *
	 * @default false
	 */
	__experimentalHasMultipleOrigins?: boolean;
	/**
	 * Whether this is rendered in the sidebar.
	 *
	 * @default false
	 */
	__experimentalIsRenderedInSidebar?: boolean;
};
