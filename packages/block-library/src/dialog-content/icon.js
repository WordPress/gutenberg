/**
 * WordPress dependencies
 */
import { SVG, Path, Rect } from '@wordpress/primitives';

export default (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect
			x="4"
			y="5"
			width="16"
			height="14"
			rx="1.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<Path d="M7 9H17V10.5H7V9Z" fill="currentColor" />
		<Path d="M7 12H14V13.5H7V12Z" fill="currentColor" />
	</SVG>
);
