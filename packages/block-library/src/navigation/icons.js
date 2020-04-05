/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

export const justifyLeftIcon = (
	<SVG
		width="20"
		height="20"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
	>
		<Path d="M11 16v-3h10v-2H11V8l-4 4 4 4zM5 4H3v16h2V4z" />
	</SVG>
);

export const justifyCenterIcon = (
	<SVG
		width="20"
		height="20"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
	>
		<Path d="M5 8v3H1v2h4v3l4-4-4-4zm14 8v-3h4v-2h-4V8l-4 4 4 4zM13 4h-2v16h2V4z" />
	</SVG>
);

export const justifyRightIcon = (
	<SVG
		width="20"
		height="20"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
	>
		<Path d="M13 8v3H3v2h10v3l4-4-4-4zm8-4h-2v16h2V4z" />
	</SVG>
);
