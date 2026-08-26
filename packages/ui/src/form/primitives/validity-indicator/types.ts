export type ValidityIndicatorProps = {
	/**
	 * The `id` to apply to the indicator element, so it can be associated
	 * with the control via `aria-describedby`.
	 */
	id?: string;
	/**
	 * The validation status to indicate.
	 */
	type: 'validating' | 'valid' | 'invalid';
	/**
	 * The message to display next to the status icon.
	 */
	message?: string;
};
