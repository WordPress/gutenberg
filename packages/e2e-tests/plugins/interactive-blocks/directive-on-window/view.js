/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const { state } = store( 'directive-on-window', {
	state: {
		counter: 0,
	},
	callbacks: {
		resizeHandler: ( ) => {
			state.counter += 1;
		},
	},
} );
