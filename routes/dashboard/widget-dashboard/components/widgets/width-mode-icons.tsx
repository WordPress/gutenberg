/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/primitives';

/*
 * 3x3 grid of cells. The widget occupies a continuous rectangle in the
 * top row; the remaining cells render as 2x2 dots to convey grid context
 * without competing with the widget mark. Cells are 6x6 at (2,2),
 * (9,2), (16,2) and the rows below, with a 1-unit gap.
 */

/**
 * Top-left cell occupied. Custom width: the widget takes a specific
 * portion of the row.
 */
export const widthCustom = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M2 2h6v6h-6ZM11 4h2v2h-2ZM18 4h2v2h-2ZM4 11h2v2h-2ZM11 11h2v2h-2ZM18 11h2v2h-2ZM4 18h2v2h-2ZM11 18h2v2h-2ZM18 18h2v2h-2Z" />
	</SVG>
);

/**
 * Trailing two-thirds of the top row occupied as a single rectangle.
 * Fill width: the widget grows over the remaining row after a sibling.
 */
export const widthFill = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M9 2h13v6h-13ZM4 4h2v2h-2ZM4 11h2v2h-2ZM11 11h2v2h-2ZM18 11h2v2h-2ZM4 18h2v2h-2ZM11 18h2v2h-2ZM18 18h2v2h-2Z" />
	</SVG>
);

/**
 * Entire top row occupied as a single rectangle. Full width: the widget
 * spans the row edge to edge.
 */
export const widthFull = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M2 2h20v6h-20ZM4 11h2v2h-2ZM11 11h2v2h-2ZM18 11h2v2h-2ZM4 18h2v2h-2ZM11 18h2v2h-2ZM18 18h2v2h-2Z" />
	</SVG>
);
