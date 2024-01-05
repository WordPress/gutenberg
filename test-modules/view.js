/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const foo = await import( './utils' );

store( 'core/test', {
	state: {
		get foo() {
			return foo;
		},
	},
} );
