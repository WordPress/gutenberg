export type ResponsiveWrapperProps = {
	/**
	 * The intrinsic width of the element to wrap. Will be used to determine the aspect ratio.
	 */
	naturalWidth?: number;
	/**
	 * The intrinsic height of the element to wrap. Will be used to determine the aspect ratio.
	 */
	naturalHeight?: number;
	/**
	 * The element to wrap.
	 */
	children: React.ReactElement;
	/**
	 * If true, the wrapper will be `span` instead of `div`.
	 *
	 * @default false
	 */
	isInline?: boolean;
};
