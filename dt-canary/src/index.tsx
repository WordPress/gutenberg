/**
 * WordPress dependencies
 */
import * as D from '@wordpress/data';
import * as E from '@wordpress/element';

D.combineReducers( {
	foo: () => false,
} );

const d = E.createElement( 'div' );
E.render( d, window.document.getElementById( 'app' ) );
