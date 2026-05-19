/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/primitives';

/*
 * Width-mode glyphs over a 3-column row metaphor. The shared row spans
 * x=2 to x=22 at y=8 to y=16 (20x8). `custom` shows the widget as a
 * single occupied cell among siblings; `fill` and `full` merge the
 * widget's cells into one contiguous rectangle to convey continuity.
 */

/**
 * One occupied cell among two siblings. Custom width: the widget takes
 * a specific portion of the row.
 */
export const widthCustom = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M2 8h6v8h-6ZM9 8h6v8h-6ZM10 9h4v6h-4ZM16 8h6v8h-6ZM17 9h4v6h-4Z"
		/>
	</SVG>
);

/**
 * Trailing rectangle spanning two columns next to a sibling frame.
 * Fill width: the widget grows over the remaining row.
 */
export const widthFill = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M2 8h6v8h-6ZM3 9h4v6h-4ZM9 8h13v8H9Z"
		/>
	</SVG>
);

/**
 * Single rectangle spanning all three columns. Full width: the widget
 * spans the entire row.
 */
export const widthFull = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M2 8h20v8H2Z" />
	</SVG>
);
