/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

// This module will be artificially delayed in the test.
// It also imports @wordpress/interactivity, so when it's evaluated,
// the interactivity runtime will have already been initialized by
// the fast module. The test verifies that hydration waits for this
// module to finish loading before running.

store( 'test/hydration-timing', {
	state: {
		slowModuleLoaded: 'yes',
	},
	callbacks: {
		slowInit() {
			const context = getContext();
			context.slowInitialized = true;
		},
	},
} );
