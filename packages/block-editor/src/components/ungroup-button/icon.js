/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/components';

const UngroupSVG = (
	<SVG
		width="20"
		height="20"
		viewBox="0 0 20 20"
		xmlns="http://www.w3.org/2000/svg"
	>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M9 2H15C16.1 2 17 2.9 17 4V7C17 8.1 16.1 9 15 9H9C7.9 9 7 8.1 7 7V4C7 2.9 7.9 2 9 2ZM9 7H15V4H9V7Z"
		/>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M5 11H11C12.1 11 13 11.9 13 13V16C13 17.1 12.1 18 11 18H5C3.9 18 3 17.1 3 16V13C3 11.9 3.9 11 5 11ZM5 16H11V13H5V16Z"
		/>
	</SVG>
);

export default UngroupSVG;
