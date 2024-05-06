/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

store( 'test/generator-scope', {
	callbacks: {
		*resolve() {
			try {
				getContext().result = yield Promise.resolve( 'ok' );
			} catch ( err ) {
				getContext().result = err.toString();
			}
		},
		*reject() {
			try {
				getContext().result = yield Promise.reject( new Error( '😘' ) );
			} catch ( err ) {
				getContext().result = err.toString();
			}
		},
	},
} );
