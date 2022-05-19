/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

const fromPathData24x24 = ( pathData ) => (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d={ pathData } />
	</SVG>
);

export const clipboard = fromPathData24x24(
	'M16 18H8v-2h8v2zm0-6H8v2h8v-2zm2-9h-2v2h2v15H6V5h2V3H6a2 2 0 00-2 2v15a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2zm-4 2V4a2 2 0 10-4 0v1a2 2 0 00-2 2v1h8V7a2 2 0 00-2-2z'
);
export const posts = fromPathData24x24(
	'M16 19H3v-2h13v2zm5-10H3v2h18V9zM3 5v2h11V5H3zm14 0v2h4V5h-4zm-6 8v2h10v-2H11zm-8 0v2h5v-2H3z'
);
export const pages = fromPathData24x24(
	'M16 8H8V6h8v2zm0 2H8v2h8v-2zm4-6v12l-6 6H6c-1.105 0-2-.895-2-2V4c0-1.105.895-2 2-2h12c1.105 0 2 .895 2 2zm-2 10V4H6v16h6v-4c0-1.105.895-2 2-2h4z'
);
export const refresh = fromPathData24x24(
	'M17.91 14c-.478 2.833-2.943 5-5.91 5-3.308 0-6-2.692-6-6s2.692-6 6-6h2.172l-2.086 2.086L13.5 10.5 18 6l-4.5-4.5-1.414 1.414L14.172 5H12c-4.418 0-8 3.582-8 8s3.582 8 8 8c4.08 0 7.438-3.055 7.93-7h-2.02z'
);
export const noticeOutline = fromPathData24x24(
	'M12 4c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8m0-2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 13h-2v2h2v-2zm-2-2h2l.5-6h-3l.5 6z'
);
export const empty = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" />
);
export const search = fromPathData24x24(
	'M21,19l-5.154-5.154C16.574,12.742,17,11.421,17,10c0-3.866-3.134-7-7-7s-7,3.134-7,7c0,3.866,3.134,7,7,7 c1.421,0,2.742-0.426,3.846-1.154L19,21L21,19z M5,10c0-2.757,2.243-5,5-5s5,2.243,5,5s-2.243,5-5,5S5,12.757,5,10z'
);
export default {
	empty,
	posts,
	pages,
	refresh,
	search,
};
