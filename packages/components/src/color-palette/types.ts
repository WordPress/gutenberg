/**
 * External dependencies
 */
import type { CSSProperties, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { DropdownProps } from '../dropdown/types';
import type { HeadingSize } from '../heading/types';

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
	onChange: ( newColor?: string, index?: number ) => void;
	value?: string;
	actions?: ReactNode;
	headingLevel?: HeadingSize;
};

export type SinglePaletteProps = PaletteProps & {
	colors: ColorObject[];
};

export type MultiplePalettesProps = PaletteProps & {
	colors: PaletteObject[];
};

export type CustomColorPickerDropdownProps = DropdownProps & {
	isRenderedInSidebar: boolean;
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
	colors?: PaletteObject[] | ColorObject[];
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
	 * The heading level.
	 *
	 * @default 2
	 */
	headingLevel?: HeadingSize;
	/**
	 * Currently active value.
	 */
	value?: string;
	/**
	 * Whether this is rendered in the sidebar.
	 *
	 * @default false
	 */
	__experimentalIsRenderedInSidebar?: boolean;
};
