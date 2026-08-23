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
	 * The slug of the selected duotone preset. When a non-empty `selectedSlug`
	 * is provided, selection is decided strictly by slug, which keeps two
	 * presets holding the same pair of colors apart. Presets whose slug does
	 * not match will not appear selected in this mode, even if their colors
	 * match `value`.
	 *
	 * An empty string is treated the same as `undefined`: selection falls back
	 * to matching by color value.
	 */
	selectedSlug?: string;
	/**
	 * Callback which is called when the duotone colors change.
	 *
	 * When the change comes from picking a preset out of `duotonePalette`, the
	 * preset's index and slug are passed too. Two presets can hold the same
	 * pair of colors, so the value alone does not identify which one was
	 * picked.
	 *
	 * Both are omitted whenever no preset is being picked: the custom, unset
	 * and clear controls, and deselecting the currently selected preset, which
	 * reports `undefined` alone.
	 */
	onChange: (
		value: DuotonePickerProps[ 'value' ] | undefined,
		index?: number,
		slug?: string
	) => void;
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
