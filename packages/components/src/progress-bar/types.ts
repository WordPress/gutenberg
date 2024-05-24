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
	 * If `true`, the progress bar will expand to fill its container, ignoring the default `max-width` of 160px.
	 * This allows the progress bar to adapt to different container sizes.
	 * @default false
	 */
	hasUnconstrainedWidth?: boolean;
};
