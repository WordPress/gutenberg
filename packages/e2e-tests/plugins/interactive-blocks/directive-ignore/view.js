/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state } = store( 'directive-ignore', {
	actions: {
		run() {
			getContext().one = '1';
			getContext().two = '2';
		},
		click() {
			state.clicks += 1;
		},
	},
} );
