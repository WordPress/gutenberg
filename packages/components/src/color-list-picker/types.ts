export type ColorListPickerProps = {
	colors: Array< { name: string; color: string } >;
	labels: Array< string >;
};

export type ColorOptionProps = Pick< ColorListPickerProps, 'colors' > & {
	label: ColorListPickerProps[ 'labels' ][ number ];
};
