/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const { state } = store( 'csp-nonce', {
	state: {
		count: 0,
	},
	actions: {
		inc() {
			state.count += 1;
		},
	},
} );
