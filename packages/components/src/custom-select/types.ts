export type CustomSelectProps = {
	label?: string;
	/**
	 * Function called with the control's internal state changes. The `selectedItem` property contains the next selected item.
	 */
	onChange?: Function;
	/**
	 * The options that can be chosen from.
	 */
	options: Array< {
		key: string;
		name: string;
		style?: {};
		className?: string;
		__experimentalHint?: string;
	} >;
};
