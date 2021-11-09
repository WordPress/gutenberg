export type ScrollableDirection = 'x' | 'y' | 'auto';

export type Props = {
	/**
	 * Renders a scrollbar for a specific axis when content overflows.
	 *
	 * @default 'y'
	 */
	scrollDirection?: ScrollableDirection;
	/**
	 * Enables (CSS) smooth scrolling.
	 *
	 * @default false
	 */
	smoothScroll?: boolean;
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
};
