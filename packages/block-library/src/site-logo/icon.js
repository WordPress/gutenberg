/**
 * WordPress dependencies
 */
import { SVG, Path, Circle } from '@wordpress/components';

export default (
	<SVG width="24" height="24" viewBox="0 0 24 24">
		<Circle
			cx="12"
			cy="12"
			r="7.25"
			stroke="black"
			strokeWidth="1.5"
			fill="none"
		/>
		<Path
			d="M5.5 14.5L9.71429 12L12.5 13.3333L15.75 11L19 13.3333"
			stroke="black"
			strokeWidth="1.5"
			strokeLinejoin="round"
			fill="none"
		/>
	</SVG>
);
