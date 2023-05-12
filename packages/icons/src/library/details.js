/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

const details = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path
			d="M4 16h10v1.5H4V16Zm0-4.5h16V13H4v-1.5ZM10 7h10v1.5H10V7Z"
			fillRule="evenodd"
			clipRule="evenodd"
		/>
		<Path d="m4 5.25 4 2.5-4 2.5v-5Z" />
	</SVG>
);

export default details;
