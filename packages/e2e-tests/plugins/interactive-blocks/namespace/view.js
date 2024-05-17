/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

store( 'namespace', {
	state: {
		url: '/some-url',
	},
} );

store( 'other', {
	state: {
		url: '/other-store-url',
	},
} );
