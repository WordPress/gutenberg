/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

/*
 * `data-wp-run` resolves the path via the legacy (dotted-path) evaluate
 * path, which does not catch errors, and then invokes the resolved function
 * during render. So the throw below propagates synchronously out of
 * `hydrate()`.
 */
store( 'throwing-island', {
	callbacks: {
		boom() {
			throw new Error( 'throwing island boom' );
		},
	},
} );
