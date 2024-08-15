/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type ScrollableDirection = 'x' | 'y' | 'auto';

export type ScrollableProps = {
	/**
	 * The children elements.
	 */
	children: ReactNode;
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
};
