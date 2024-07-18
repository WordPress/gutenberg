/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state } = store( 'directive-style', {
	state: {
		falseValue: false,
		color: 'red',
		border: '2px solid yellow',
	},
	actions: {
		toggleColor() {
			state.color = state.color === 'red' ? 'blue' : 'red';
		},
		switchColorToFalse() {
			state.color = false;
		},
		toggleContext() {
			const context = getContext();
			context.color = context.color === 'red' ? 'blue' : 'red';
		},
	},
} );
