/**
 * WordPress dependencies
 */
import { SVG, Path, Rect } from '@wordpress/primitives';

const queryPaginationPrevious = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect
			x="18"
			y="13.5"
			width="3"
			height="3"
			rx="1.5"
			transform="rotate(-180 18 13.5)"
			fill="#000"
		/>
		<Rect
			x="13"
			y="13.5"
			width="3"
			height="3"
			rx="1.5"
			transform="rotate(-180 13 13.5)"
			fill="#000"
		/>
		<Path d="M7.5 14.5L5 12l2.5-2.5" stroke="#1E1E1E" strokeWidth="1.5" />
	</SVG>
);

export default queryPaginationPrevious;
