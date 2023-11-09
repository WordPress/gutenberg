// TO DO
export type CustomSelectProps = {
	/**
	 * The children elements. This should be composed
	 * of CustomSelect.Item components.
	 */
	children: React.ReactNode;
	/**
	 * An optional default value for the control.
	 * If left undefined, the first non-disabled
	 * item will be used
	 */
	defaultValue?: any;
	/**
	 * Label for the control.
	 */
	label?: string;
	/**
	 * A function that receives the new value of the input.
	 */
	onChange?: Function;
	/**
	 * The size of the select.
	 */
	size?: 'default' | 'large';
};

export type CustomSelectItemProps = {
	/**
	 * The children elements to be displayed for the select options.
	 */
	children: React.ReactNode;
	/**
	 * The current value of the select. Can be used in lieu of
	 * children if only a string is needed.
	 */
	value?: any;
};
