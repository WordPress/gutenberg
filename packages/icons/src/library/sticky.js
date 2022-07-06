/**
 * WordPress dependencies
 */
import { SVG, Path, Rect } from '@wordpress/primitives';

const sticky = (
	<SVG viewBox="0 0 25 20" xmlns="http://www.w3.org/2000/svg">
		<Path d="M11.5 10H13.5V16L12.5 18L11.5 16V10Z" />
		<Path d="M9.5 4H15.5L16 10H9L9.5 4Z" />
		<Rect x="7.5" y="10" width="10" height="2" rx="1" />
	</SVG>
);

export default sticky;
