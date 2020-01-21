/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';

function Icon( { icon, size = 24, ...props } ) {
	return cloneElement( icon, {
		width: size,
		height: size,
		...props,
	} );
}

export default Icon;
