/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/primitives';

const lineDashed = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
		<Path
			fillRule="evenodd"
			d="M5 11.25h3v1.5H5v-1.5zm5.5 0h3v1.5h-3v-1.5zm8.5 0h-3v1.5h3v-1.5z"
			clipRule="evenodd"
		/>
	</SVG>
);

export default lineDashed;
