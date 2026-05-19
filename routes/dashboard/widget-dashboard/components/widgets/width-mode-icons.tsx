/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/primitives';

/**
 * Row container with a small filled cell inside. Represents a widget
 * occupying a custom (numeric) portion of a grid row.
 */
export const widthCustom = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M3 8h18v8H3ZM4 9h16v6H4ZM5 10h4v4H5Z"
		/>
	</SVG>
);

/**
 * Row container with a wide filled cell anchored to the trailing edge.
 * Represents a widget filling the remaining space in a grid row.
 */
export const widthFill = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M3 8h18v8H3ZM4 9h16v6H4ZM10 10h10v4H10Z"
		/>
	</SVG>
);

/**
 * Solid bar spanning the full icon width. Represents a widget that
 * spans the entire grid row.
 */
export const widthFull = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M3 10h18v4H3Z" />
	</SVG>
);
