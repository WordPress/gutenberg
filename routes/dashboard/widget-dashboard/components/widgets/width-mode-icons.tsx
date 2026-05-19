/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/primitives';

/*
 * 3-cell row indicating the widget's footprint within a grid row.
 * Empty cells render as 1-unit frames; occupied cells as solid 6x6
 * squares. Geometry shared across the three variants: cells at
 * (2,9), (9,9), (16,9), each 6x6, with a 1-unit gap.
 */

/**
 * One occupied cell (left). Custom width: the widget takes a specific
 * portion of the row.
 */
export const widthCustom = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M2 9h6v6H2ZM9 9h6v6H9ZM10 10h4v4h-4ZM16 9h6v6h-6ZM17 10h4v4h-4Z"
		/>
	</SVG>
);

/**
 * Two trailing cells occupied. Fill width: the widget grows over the
 * remaining row after a sibling.
 */
export const widthFill = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M2 9h6v6H2ZM3 10h4v4H3ZM9 9h6v6H9ZM16 9h6v6h-6Z"
		/>
	</SVG>
);

/**
 * All three cells occupied. Full width: the widget spans the entire row.
 */
export const widthFull = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M2 9h6v6H2ZM9 9h6v6H9ZM16 9h6v6h-6Z" />
	</SVG>
);
