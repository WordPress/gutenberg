/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

export type ColorListPickerProps = {
	colors: Array< {
		name: string;
		color: NonNullable< CSSProperties[ 'color' ] >;
	} >;
	labels: Array< string >;
	value?: Array< string >;
	disableCustomColors?: boolean;
	enableAlpha?: boolean;
	onChange: ( newValue: Array< string > ) => void; // TODO: resolve conflict with ColorPalette's onChange prop, which expects an optional value arg.
};

export type ColorOptionProps = Pick<
	ColorListPickerProps,
	'colors' | 'disableCustomColors' | 'enableAlpha'
> & {
	label: ColorListPickerProps[ 'labels' ][ number ];
	value: string; // TODO: can we extract this from ColorListPickerProps['value']? That prop being optional is a little tricky
	onChange: ( newValue: string ) => void; // TODO: resolve conflict with ColorPalette's onChange prop, which expects an optional value arg.
};
