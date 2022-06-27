/**
 * External dependencies
 */
import type { CSSProperties, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { ResponsiveCSSValue } from '../ui/utils/types';

type GridAlignment =
	| 'bottom'
	| 'bottomLeft'
	| 'bottomRight'
	| 'center'
	| 'spaced'
	| 'left'
	| 'right'
	| 'stretch'
	| 'top'
	| 'topLeft'
	| 'topRight';

export type GridProps = {
	/**
	 * Adjusts the block alignment of children.
	 */
	align?: CSSProperties[ 'alignItems' ];
	/**
	 * Adjusts the horizontal and vertical alignment of children.
	 */
	alignment?: GridAlignment;
	/**
	 * The children elements.
	 */
	children: ReactNode;
	/**
	 * Adjusts the number of columns of the `Grid`.
	 *
	 * @default 2
	 */
	columns?: ResponsiveCSSValue< number >;
	/**
	 * Adjusts the `grid-column-gap`.
	 */
	columnGap?: CSSProperties[ 'gridColumnGap' ];
	/**
	 * Gap between each child.
	 *
	 * @default 3
	 */
	gap?: number;
	/**
	 * Changes the CSS display from `grid` to `inline-grid`.
	 */
	isInline?: boolean;
	/**
	 * Adjusts the inline alignment of children.
	 */
	justify?: CSSProperties[ 'justifyContent' ];
	/**
	 * Adjusts the `grid-row-gap`.
	 */
	rowGap?: CSSProperties[ 'gridRowGap' ];
	/**
	 * Adjusts the number of rows of the `Grid`.
	 */
	rows?: ResponsiveCSSValue< number >;
	/**
	 * Adjusts the CSS grid `template-columns`.
	 */
	templateColumns?: CSSProperties[ 'gridTemplateColumns' ];
	/**
	 * Adjusts the CSS grid `template-rows`.
	 */
	templateRows?: CSSProperties[ 'gridTemplateRows' ];
};
