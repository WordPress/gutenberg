export type DuotonePickerProps = {
	/**
	 * Whether there should be a button to clear the duotone value.
	 *
	 * @default true
	 */
	clearable?: boolean;
	/**
	 * Whether there should be an `unset` option.
	 *
	 * @default true
	 */
	unsetable?: boolean;
	/**
	 * Array of color presets of the form `{ color: '#000000', name: 'Black', slug: 'black' }`.
	 */
	colorPalette: Color[];
	/**
	 * Array of duotone presets of the form `{ colors: [ '#000000', '#ffffff' ], name: 'Grayscale', slug: 'grayscale' }`.
	 */
	duotonePalette: DuotoneColor[];
	/**
	 * Array of duotone presets of the form `{ colors: [ '#000000', '#ffffff' ], name: 'Grayscale', slug: 'grayscale' } grouped by origin`.
	 */
	duotonePaletteByOrigin?: duotonePaletteByOrigin;
	/**
	 * Whether custom colors should be disabled.
	 *
	 * @default false
	 */
	disableCustomColors?: boolean;
	/**
	 * Whether custom duotone values should be disabled.
	 *
	 * @default false
	 */
	disableCustomDuotone?: boolean;
	/**
	 * An array of colors for the duotone effect.
	 */
	value?: string[] | 'unset';
	/**
	 * Callback which is called when the duotone colors change.
	 */
	onChange: ( value: DuotonePickerProps[ 'value' ] | undefined ) => void;
};

type Color = {
	color: string;
	name: string;
	slug: string;
};

type duotonePaletteByOrigin = Array< {
	name: string;
	palettes: DuotoneColor[];
} >;

type DuotoneColor = {
	colors: string[];
	name: string;
	slug: string;
};

export type DuotoneSwatchProps = {
	/**
	 * An array of colors to show or `null` to show the placeholder swatch icon.
	 */
	values?: string[] | null;
};

export type SinglePaletteProps = {
	defaultDark: string;
	defaultLight: string;
	unsetable?: boolean;
	colorPalette: Color[];
	disableCustomColors?: boolean;
	disableCustomDuotone?: boolean;
	value?: string[] | 'unset';
	unsetOption: React.ReactElement;
	onChange: ( value: DuotonePickerProps[ 'value' ] | undefined ) => void;
	clearable?: boolean;
	duotonePalette: DuotoneColor[];
};

export type MultiplePalettesProps = {
	defaultDark: string;
	defaultLight: string;
	unsetable?: boolean;
	colorPalette: Color[];
	disableCustomColors?: boolean;
	disableCustomDuotone?: boolean;
	value?: string[] | 'unset';
	unsetOption: React.ReactElement;
	onChange: ( value: DuotonePickerProps[ 'value' ] | undefined ) => void;
	duotonePaletteByOrigin: duotonePaletteByOrigin;
};

export type paletteOptionsProps = {
	palette: DuotoneColor[];
	value?: string[] | 'unset';
	onChange: ( value: DuotonePickerProps[ 'value' ] | undefined ) => void;
};
