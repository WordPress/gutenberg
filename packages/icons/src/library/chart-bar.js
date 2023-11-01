/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

const chartBar = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fillRule="evenodd"
			d="M11.25 5h1.5v15h-1.5V5zM6 10h1.5v10H6V10zm12 4h-1.5v6H18v-6z"
			clipRule="evenodd"
		/>
	</SVG>
);

export default chartBar;
