export type ProgressBarProps = {
	/**
	 * Value of the progress bar.
	 */
	value?: number;

	/**
	 * A CSS class to apply to the progress bar wrapper (track) element.
	 */
	className?: string;

	/**
	 * The HTML `id` of the `progress` element.
	 * This is necessary to be able to accessibly associate the label with that element.
	 */
	id?: string;
};
