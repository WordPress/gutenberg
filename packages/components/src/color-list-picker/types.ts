export type ColorListPickerProps = {
	colors: Array< { name: string; color: string } >;
};

export type ColorOptionProps = Pick< ColorListPickerProps, 'colors' >;
