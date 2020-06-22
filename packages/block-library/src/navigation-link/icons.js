/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

export const ToolbarSubmenuIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24">
		<Path d="M2 12c0 3.6 2.4 5.5 6 5.5h.5V19l3-2.5-3-2.5v2H8c-2.5 0-4.5-1.5-4.5-4s2-4.5 4.5-4.5h3.5V6H8c-3.6 0-6 2.4-6 6zm19.5-1h-8v1.5h8V11zm0 5h-8v1.5h8V16zm0-10h-8v1.5h8V6z" />
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
