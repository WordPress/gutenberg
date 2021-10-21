/**
 * WordPress dependencies
 */
import { SVG, Path, Rect } from '@wordpress/primitives';

const queryPaginationNumbers = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="4" y="10.5" width="6" height="3" rx="1.5" />
		<Path d="M13.5 14v-4l-1.5.5" />
		<Path d="M19.266 9.805c-.473-.611-1.22-.51-1.702-.367a3.854 3.854 0 00-.718.307l.13 1.082c.192-.17.47-.422.782-.515.34-.1.578.025.668.141.21.27-.034.835-.16 1.055-.49.85-.93 1.594-1.45 2.492H19.5v-1h-.914c.277-.574.814-1.443.914-2.106.052-.343.02-.762-.234-1.09z" />
	</SVG>
);

export default queryPaginationNumbers;
