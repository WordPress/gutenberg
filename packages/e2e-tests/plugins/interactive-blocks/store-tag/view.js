/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const { state } = store( 'store-tag', {
	state: {
		counter: {
			// `value` is defined in the server.
			get double() {
				return state.counter.value * 2;
			},
			clicks: 0,
		},
	},
	actions: {
		counter: {
			increment() {
				state.counter.value += 1;
				state.counter.clicks += 1;
			},
		},
	},
} );
