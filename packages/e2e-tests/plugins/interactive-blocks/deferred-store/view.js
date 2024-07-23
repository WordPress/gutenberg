/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

window.addEventListener(
	'_test_proceed_',
	() => {
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
	},
	{ once: true }
);
