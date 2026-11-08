export type ControlledStateOptions< T > = {
	/**
	 * Initial value
	 */
	initial?: T;
	/**
	 * Fallback value
	 */
	fallback: T | '';
};
