/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';
import '@wordpress/interactivity-router';

const { state } = store( 'router-race-condition', {
	state: {
		counter: 0,
	},
	actions: {
		increment() {
			const context = getContext();
			context.counter += 1;
		},
		incrementGlobal() {
			state.counter += 1;
		},
	},
} );
