/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/primitives';

const postCommentsReplyLink = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
	>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M6.24878 11.0649L6.68822 10.625H7.31H9.875L8.375 12.125H7.31L5.35252 14.0845C5.10601 14.3313 4.72711 14.3878 4.41935 14.2237C4.16123 14.086 4 13.8173 4 13.5247V5C4 4.44771 4.44772 4 5 4H13C13.5523 4 14 4.44772 14 5V6.5L12.5 8V5.5L5.5 5.5L5.5 11.8145L6.24878 11.0649Z"
			fill="black"
		></Path>
		<Path
			d="M14 10L10 14.5M10 14.5L14 18.5M10 14.5C13.3333 14.5 13.7976 14.5 16.9976 14.5C20.1983 14.5 19.9973 19 19.9976 20.5"
			stroke="#1E1E1E"
			strokeWidth="1.5"
		></Path>
	</SVG>
);

export default postCommentsReplyLink;
