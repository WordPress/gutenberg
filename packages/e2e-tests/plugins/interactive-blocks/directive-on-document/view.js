/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const { state } = store( 'directive-on-document', {
	state: {
		counter: 0,
	},
	callbacks: {
		keydownHandler: ( ) => {
			state.counter += 1;
		},
	},
} );
