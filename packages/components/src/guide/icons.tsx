/**
 * WordPress dependencies
 */
import { SVG, Circle } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import type { PageControlIconProps } from './types';

export const PageControlIcon = ( { isSelected }: PageControlIconProps ) => (
	<SVG width="8" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Circle
			cx="4"
			cy="4"
			r="4"
			fill={ isSelected ? '#419ECD' : '#E1E3E6' }
		/>
	</SVG>
);
