/**
 * WordPress dependencies
 */
import { Path, Rect, SVG } from '@wordpress/components';

export const editImageIcon = (
	<SVG width={ 20 } height={ 20 } viewBox="0 0 20 20">
		<Rect x={ 11 } y={ 3 } width={ 7 } height={ 5 } rx={ 1 } />
		<Rect x={ 2 } y={ 12 } width={ 7 } height={ 5 } rx={ 1 } />
		<Path d="M13,12h1a3,3,0,0,1-3,3v2a5,5,0,0,0,5-5h1L15,9Z" />
		<Path d="M4,8H3l2,3L7,8H6A3,3,0,0,1,9,5V3A5,5,0,0,0,4,8Z" />
	</SVG>
);
