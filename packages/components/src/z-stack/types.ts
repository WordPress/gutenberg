/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type ZStackProps = {
	/**
	 * Layers children elements on top of each other (first: highest z-index,
	 * last: lowest z-index).
	 *
	 * @default true
	 */
	isLayered?: boolean;
	/**
	 * Reverse the layer ordering (first: lowest z-index, last: highest
	 * z-index).
	 *
	 * @default false
	 */
	isReversed?: boolean;
	/**
	 * The amount of space between each child element. Its value is
	 * automatically inverted (i.e. from positive to negative, and viceversa)
	 * when switching from LTR to RTL.
	 *
	 * @default 0
	 */
	offset?: number;
	/**
	 * The children to stack.
	 */
	children: ReactNode;
};
