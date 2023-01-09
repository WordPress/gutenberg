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
	value?: Array< string | undefined >;
	disableCustomColors?: boolean;
	enableAlpha?: boolean;
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
