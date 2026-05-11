/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/components';

export const resultsFound = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<Path d="M4 11h4v2H4v-2zm6 0h6v2h-6v-2zm8 0h2v2h-2v-2z" />
	</SVG>
);

export const displayingResults = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<Path d="M4 13h2v-2H4v2zm4 0h10v-2H8v2zm12 0h2v-2h-2v2z" />
	</SVG>
);

export const queryTotal = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<Path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm.5 14c0 .3-.2.5-.5.5H6c-.3 0-.5-.2-.5-.5V6c0-.3.2-.5.5-.5h12c.3 0 .5.2.5.5v12Zm-7-6-4.1 5h8.8v-3h-1.5v1.5h-4.2l2.9-3.5-2.9-3.5h4.2V10h1.5V7H7.4l4.1 5Z" />
	</SVG>
);
