export type ColorListPickerProps = {
	colors: Array< { name: string; color: string } >;
	labels: Array< string >;
	value?: Array< string >;
	disableCustomColors?: boolean;
	enableAlpha?: boolean;
};

export type ColorOptionProps = Pick<
	ColorListPickerProps,
	'colors' | 'disableCustomColors' | 'enableAlpha'
> & {
	label: ColorListPickerProps[ 'labels' ][ number ];
	value: string; // TODO: can we extract this from ColorListPickerProps['value']? That prop being optional is a little tricky
};
