/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

export type ColorListPickerProps = {
	/**
	 * A list of predefined colors. Each color is an object with a `name` and a
	 * `color` value.
	 * The `name` is a string used to identify the color in the UI.
	 * The `color` is a valid CSS color string.
	 */
	colors: Array< {
		name: string;
		color: NonNullable< CSSProperties[ 'color' ] >;
	} >;
	/**
	 * A list of labels for each of the options displayed in the UI.
	 */
	labels: Array< string >;
	/**
	 * An array containing the currently selected colors.
	 */
	value?: Array< string >;
	/**
	 * Controls whether the custom color picker is displayed.
	 */
	disableCustomColors?: boolean;
	/**
	 * Controls whether the ColorPalette should show an alpha channel control.
	 */
	enableAlpha?: boolean;
	/**
	 * A function that receives the updated color value.
	 */
	onChange: ( newValue: Array< string | undefined > ) => void;
};

export type ColorOptionProps = Pick<
	ColorListPickerProps,
	'colors' | 'disableCustomColors' | 'enableAlpha'
> & {
	label: ColorListPickerProps[ 'labels' ][ number ];
	value: string | undefined;
	onChange: ( newValue: string | undefined ) => void;
};
