/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { callbacks } = store( 'test/generator-scope', {
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
		*capture() {
			let value = yield Promise.resolve( 1 );
			try {
				value = yield Promise.reject( 2 );
			} catch ( e ) {
				value = yield Promise.resolve( 3 );
			}
			getContext().result = value;
		},
		*throw() {
			const value = yield Promise.resolve( '🤯' );
			throw new Error( value );
		},
		*captureThrow() {
			try {
				yield callbacks.throw();
			} catch ( err ) {
				getContext().result = err.toString();
			}
		},
		*returnReject() {
			return Promise.reject( new Error( '🔚' ) );
		},
		*captureReturnReject() {
			try {
				yield callbacks.returnReject();
			} catch ( err ) {
				getContext().result = err.toString();
			}
		},
	},
} );
