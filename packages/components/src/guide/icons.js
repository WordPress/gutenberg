/**
 * WordPress dependencies
 */
import { SVG, Path, Circle } from '@wordpress/primitives';

export const BackButtonIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24">
		<Path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
		<Path d="M0 0h24v24H0z" fill="none" />
	</SVG>
);

export const ForwardButtonIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24">
		<Path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
		<Path d="M0 0h24v24H0z" fill="none" />
	</SVG>
);

export const PageControlIcon = ( { isSelected } ) => (
	<SVG width="8" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Circle
			cx="4"
			cy="4"
			r="4"
			fill={ isSelected ? '#419ECD' : '#E1E3E6' }
		/>
	</SVG>
);
