/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

export const ToolbarSubmenuIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24">
		<Path d="M14 5h8v2h-8zm0 5.5h8v2h-8zm0 5.5h8v2h-8zM2 11.5C2 15.08 4.92 18 8.5 18H9v2l3-3-3-3v2h-.5C6.02 16 4 13.98 4 11.5S6.02 7 8.5 7H12V5H8.5C4.92 5 2 7.92 2 11.5z" />
		<Path fill="none" d="M0 0h24v24H0z" />
	</SVG>
);

export const ItemSubmenuIcon = () => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		width="12"
		height="12"
		viewBox="0 0 24 24"
		transform="rotate(90)"
	>
		<Path d="M8 5v14l11-7z" />
		<Path d="M0 0h24v24H0z" fill="none" />
	</SVG>
);
