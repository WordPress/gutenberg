/**
 * Internal dependencies
 */
import { useAnimate } from '..';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export default function Animate( { type, options = {}, children } ) {
	deprecated( 'Animate component', {
		version: '9.6',
		alternative: 'useAnimate hook',
	} );
	return children( {
		className: useAnimate( { type, ...options } ),
	} );
}
