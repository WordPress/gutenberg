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
		<Path
			d="M15.5 16.5H17.5C17.7761 16.5 18 16.2761 18 16V15C18 14.7239 17.7761 14.5 17.5 14.5H15.5C15.2239 14.5 15 14.7239 15 15V16C15 16.2761 15.2239 16.5 15.5 16.5Z"
			fill="currentColor"
		/>
	</SVG>
);
