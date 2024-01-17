/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const { state } = store( 'directive-on-document', {
	state: {
		counter: 0,
	},
	actions: {
		counter: 0,
		keydownHandler: ( ) => {
			state.counter += 1;
		},
	},
} );
