/**
 * WordPress dependencies
 */
import { G, Path, SVG } from '@wordpress/components';

export const icon = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path fill="none" d="M0 0h24v24H0V0z" />
		<G><Path d="M20 4v12H8V4h12m0-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 9.67l1.69 2.26 2.48-3.1L19 15H9zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" /></G>
	</SVG>
);

export const leftArrow = (
	<SVG width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
		<Path d="M5 8.70002L10.6 14.4L12 12.9L7.8 8.70002L12 4.50002L10.6 3.00002L5 8.70002Z" />
	</SVG>
);

export const rightArrow = (
	<SVG width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
		<Path d="M13 8.7L7.4 3L6 4.5L10.2 8.7L6 12.9L7.4 14.4L13 8.7Z" />
	</SVG>
);
