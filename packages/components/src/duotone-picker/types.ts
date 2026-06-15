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
	/**
	 * Whether the control should present as a set of buttons,
	 * each with its own tab stop.
	 *
	 * @default false
	 */
	asButtons?: boolean;
	/**
	 * Prevents keyboard interaction from wrapping around.
	 * Only used when `asButtons` is not true.
	 *
	 * @default true
	 */
	loop?: boolean;
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

type Color = {
	color: string;
	name: string;
	slug: string;
};

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
