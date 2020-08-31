/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

const dragHandle = (
	<SVG
		width="18"
		height="18"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 18 18"
	>
		<Path d="M4 4h2V2H4v2zm8-2v2h2V2h-2zm-8 8h2V8H4v2zm8 0h2V8h-2v2zm-8 6h2v-2H4v2zm8 0h2v-2h-2v2z" />
	</SVG>
);

export default dragHandle;
