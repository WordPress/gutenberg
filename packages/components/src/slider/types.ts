export type SliderProps = {
	/**
	 * Default value for input.
	 */
	defaultValue?: string;
	/**
	 * Renders an error state.
	 *
	 * @default false
	 */
	error?: boolean;
	/**
	 * Renders focused styles.
	 *
	 * @default false
	 */
	isFocused?: boolean;
	/**
	 * Callback function when the `value` is committed.
	 */
	onChange?: ( value: string ) => void;
	/**
	 * The Slider's current value.
	 */
	value?: string;
};
