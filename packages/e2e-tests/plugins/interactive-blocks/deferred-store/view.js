/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

document.addEventListener( 'DOMContentLoaded', () => {
	setTimeout( () => {
		store( 'test/deferred-store', {
			state: {
				reversedText() {
					return [ ...getContext().text ].reverse().join( '' );
				},

				get reversedTextGetter() {
					return [ ...getContext().text ].reverse().join( '' );
				},
			},
		} );
	}, 100 );
} );
