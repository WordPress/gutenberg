/**
 * WordPress dependencies
 */
import { Polygon, Path, SVG } from '@wordpress/components';

export const toolbarSubmenuIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24">
		<Path d="M14 5h8v2h-8zm0 5.5h8v2h-8zm0 5.5h8v2h-8zM2 11.5C2 15.08 4.92 18 8.5 18H9v2l3-3-3-3v2h-.5C6.02 16 4 13.98 4 11.5S6.02 7 8.5 7H12V5H8.5C4.92 5 2 7.92 2 11.5z" />
		<Path fill="none" d="M0 0h24v24H0z" />
	</SVG>
);

export const itemSubmenuIcon = (
	<SVG
		width="18"
		height="18"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 18 18"
	>
		<Polygon points="9,13.5 14.7,7.9 13.2,6.5 9,10.7 4.8,6.5 3.3,7.9 " />
	</SVG>
);
