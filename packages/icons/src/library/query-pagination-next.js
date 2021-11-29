/**
 * WordPress dependencies
 */
import { SVG, Path, Rect } from '@wordpress/primitives';

const queryPaginationNext = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="6" y="10.5" width="3" height="3" rx="1.5" />
		<Rect x="11" y="10.5" width="3" height="3" rx="1.5" />
		<Path d="M16.5 9.5L19 12l-2.5 2.5" strokeWidth="1.5" />
	</SVG>
);

export default queryPaginationNext;
