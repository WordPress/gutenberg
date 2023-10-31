export type RadioGroupProps = {
	/**
	 * Labels the value of the selected `Radio` element.
	 */
	label: string;
	/**
	 * The `value` of the `Radio` element which should be selected.
	 * Indicates controlled usage of the component.
	 */
	checked?: string | number;
	/**
	 * The value of the radio element which is initally selected.
	 */
	defaultChecked?: string | number;
	/**
	 * Whether the `RadioGroup` should be disabled.
	 */
	disabled?: boolean;
	/**
	 * Called when a `Radio` element has been selected.
	 * Receives the `value` of the selected element as an argument.
	 */
	onChange?: ( value: string | number | undefined ) => void;
	/**
	 * The children elements, which should be a series of `Radio` components.
	 */
	children: React.ReactNode;
};

export type RadioProps = {
	/**
	 * The actual value of the radio element.
	 */
	value: string | number;
	/**
	 * Content displayed on the Radio element. If there aren't any children, `value` is displayed.
	 */
	children?: React.ReactNode;
};
