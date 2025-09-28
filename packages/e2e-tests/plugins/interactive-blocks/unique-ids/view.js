/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state } = store( 'unique-ids-test', {
	state: {
		get renderContext() {
			const context = getContext();
			return JSON.stringify( context, null, 2 );
		},
		clickHandler1Count: 0,
		clickHandler2Count: 0,
		watcher1Count: 0,
		watcher2Count: 0,
		initHandler1Count: 0,
		initHandler2Count: 0,
	},
	actions: {
		clickHandler1: () => {
			state.clickHandler1Count++;
		},
		clickHandler2: () => {
			state.clickHandler2Count++;
		},
		increment: () => {
			const context = getContext();
			context.counter++;
		},
		initHandler1: () => {
			state.initHandler1Count++;
		},
		initHandler2: () => {
			state.initHandler2Count++;
		},
	},
	callbacks: {
		watcher1: () => {
			const context = getContext();
			// Watch counter changes
			const counter = context.counter;
			// Use counter to trigger reactivity
			if ( counter >= 0 ) {
				state.watcher1Count++;
			}
		},
		watcher2: () => {
			const context = getContext();
			// Watch counter changes
			const counter = context.counter;
			// Use counter to trigger reactivity
			if ( counter >= 0 ) {
				state.watcher2Count++;
			}
		},
	},
} );

store( 'namespace-a', {
	state: {
		renderContext: () => {
			const context = getContext();
			return JSON.stringify( context, null, 2 );
		},
	},
} );

store( 'namespace-b', {
	state: {
		renderContext: () => {
			const context = getContext();
			return JSON.stringify( context, null, 2 );
		},
	},
} );
