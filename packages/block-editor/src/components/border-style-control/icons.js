/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

export const solidIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
		<Path d="M5 11.25h14v1.5H5z" />
	</SVG>
);

export const dashedIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
		<Path
			fillRule="evenodd"
			d="M5 11.25h3v1.5H5v-1.5zm5.5 0h3v1.5h-3v-1.5zm8.5 0h-3v1.5h3v-1.5z"
			clipRule="evenodd"
		/>
	</SVG>
);

export const dottedIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
		<Path
			fillRule="evenodd"
			d="M5.25 11.25h1.5v1.5h-1.5v-1.5zm3 0h1.5v1.5h-1.5v-1.5zm4.5 0h-1.5v1.5h1.5v-1.5zm1.5 0h1.5v1.5h-1.5v-1.5zm4.5 0h-1.5v1.5h1.5v-1.5z"
			clipRule="evenodd"
		/>
	</SVG>
);
