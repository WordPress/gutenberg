import type { CSSProperties, ReactNode } from 'react';
import type { DropdownProps } from '../dropdown/types';
import type { HeadingSize } from '../heading/types';
import type { CircularOptionPickerProps } from '../circular-option-picker/types';

export type ColorObject = {
	name: string;
	color: NonNullable< CSSProperties[ 'color' ] >;
	slug?: string;
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
	 * The third argument is the slug of the selected palette entry, when available.
	 */
	onChange: ( newColor?: string, index?: number, slug?: string ) => void;
	value?: string;
	/**
	 * The slug of the currently selected palette entry.
	 *
	 * When set to a non-empty string, selection is determined by slug rather
	 * than by color value — this correctly handles palettes where two entries
	 * share the same color. Palette entries without a slug will not appear
	 * selected in this mode, even if their color value matches `value`.
	 *
	 * An empty string is treated the same as `undefined`: selection falls
	 * back to matching by color value.
	 */
	selectedSlug?: string;
	actions?: ReactNode;
	headingLevel?: HeadingSize;
	presentation: NonNullable< CircularOptionPickerProps[ 'presentation' ] >;
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

export type ColorPaletteProps = Pick<
	PaletteProps,
	'onChange' | 'selectedSlug'
> & {
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
	 * How predefined color swatches behave and are exposed to assistive
	 * technology.
	 *
	 * - `listbox` uses one tab stop and arrow-key navigation, and exposes
	 *   selection with `aria-selected`.
	 * - `toggle-buttons` gives each swatch a tab stop and exposes selection with
	 *   `aria-pressed`.
	 * - `command-buttons` gives each swatch a tab stop and exposes no selection
	 *   state. `value` and `selectedSlug` do not mark predefined swatches as
	 *   selected, and activating a swatch always calls `onChange` with that
	 *   swatch. `value` still controls the custom color picker.
	 *
	 * @default 'listbox'
	 */
	presentation?: CircularOptionPickerProps[ 'presentation' ];
	/**
	 * Whether the control should present as toggle buttons.
	 *
	 * @deprecated Use `presentation="toggle-buttons"` instead. An explicit
	 * `presentation` takes precedence.
	 * @default false
	 * @ignore
	 */
	asButtons?: boolean;
	/**
	 * Prevents keyboard interaction from wrapping around.
	 * Only used with the `listbox` presentation.
	 *
	 * @default true
	 */
	loop?: boolean;
	/**
	 * Whether this is rendered in the sidebar.
	 *
	 * @default false
	 */
	__experimentalIsRenderedInSidebar?: boolean;
} & (
		| {
				/**
				 * A label to identify the purpose of the control.
				 *
				 * @todo [#54055] Either this or `aria-labelledby` should be required
				 */
				'aria-label'?: string;
				'aria-labelledby'?: never;
		  }
		| {
				/**
				 * An ID of an element to provide a label for the control.
				 *
				 * @todo [#54055] Either this or `aria-label` should be required
				 */
				'aria-labelledby'?: string;
				'aria-label'?: never;
		  }
	);
