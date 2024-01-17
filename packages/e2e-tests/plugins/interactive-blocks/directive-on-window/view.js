/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const { state } = store( 'directive-on-window', {
	state: {
		counter: false,
	},
	actions: {
		counter: 0,
		resizeHandler: ( ) => {
			state.counter += 1;
		},
	},
} );
