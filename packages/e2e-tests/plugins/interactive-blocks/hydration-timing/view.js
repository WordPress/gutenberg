/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

// This is the "fast" module that loads immediately. It imports
// @wordpress/interactivity, which initializes the runtime.
//
// The test pairs this with a "slow" module (hydration-timing-slow) that is
// artificially delayed. The race condition occurs when this fast module
// triggers hydration before the slow module has finished loading.

store( 'test/hydration-timing', {
	state: {
		moduleLoaded: 'yes',
	},
	callbacks: {
		init() {
			const context = getContext();
			context.initialized = true;
		},
	},
} );
