/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

const square = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			fill="none"
			d="M5.75 12.75V18.25H11.25M12.75 5.75H18.25V11.25"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="square"
		/>
	</SVG>
);

export default square;
