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
	 * Whether custom colors should be disabled.
	 */
	disableCustomColors?: boolean;
	/**
	 * Whether custom duotone values should be disabled.
	 */
	disableCustomDuotone?: boolean;
	/**
	 * An array of colors for the duotone effect.
	 */
	value: string[] | 'unset';
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

type DuotoneColor = {
	colors: [ string, string ];
	name: string;
	slug: string;
};

export type DuotoneSwatchProps = {
	/**
	 * An array of colors to show or `null` to show the placeholder swatch icon.
	 */
	values?: [ string, string ] | null;
};
