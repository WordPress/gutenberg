/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties } from 'react';

type ResponsiveCSSValue< T > = Array< T | undefined > | T;

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

type GridColumns = ResponsiveCSSValue< number >;

type GridRows = ResponsiveCSSValue< number >;

export type Props = {
	/**
	 * Adjusts the block alignment of children.
	 */
	align?: CSSProperties[ 'alignItems' ];
	/**
	 * Adjusts the horizontal and vertical alignment of children.
	 */
	alignment?: GridAlignment;
	/**
	 * Adjusts the number of columns of the `Grid`.
	 *
	 * @default 2
	 */
	columns?: GridColumns;
	/**
	 * Adjusts the `grid-column-gap`.
	 */
	columnGap?: CSSProperties[ 'gridColumnGap' ];
	/**
	 * Changes the CSS display from `grid` to `inline-grid`.
	 */
	isInline?: boolean;
	/**
	 * Gap between each child.
	 *
	 * @default 3
	 */
	gap?: number;
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
	rows?: GridRows;
	/**
	 * Adjusts the CSS grid `template-columns`.
	 */
	templateColumns?: CSSProperties[ 'gridTemplateColumns' ];
	/**
	 * Adjusts the CSS grid `template-rows`.
	 */
	templateRows?: CSSProperties[ 'gridTemplateRows' ];
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
};
