/**
 * WordPress dependencies
 */
import { SVG, Circle } from '@wordpress/primitives';

export const PageControlIcon = ( { isSelected }: { isSelected: boolean } ) => (
	<SVG width="8" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Circle
			cx="4"
			cy="4"
			r="4"
			fill={ isSelected ? '#419ECD' : '#E1E3E6' }
		/>
	</SVG>
);
