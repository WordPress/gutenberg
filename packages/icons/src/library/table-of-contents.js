/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

const tableOfContents = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M20 9.484h-8.889v-1.5H20v1.5Zm0 7h-4.889v-1.5H20v1.5Zm-14 .032a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 1a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
		/>
		<Path d="M13 15.516a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 8.484a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
	</SVG>
);

export default tableOfContents;
