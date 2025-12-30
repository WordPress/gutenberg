/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state } = store( 'directive-class', {
	state: {
		trueValue: true,
		falseValue: false,
	},
	actions: {
		toggleTrueValue: () => {
			state.trueValue = ! state.trueValue;
		},
		toggleFalseValue: () => {
			state.falseValue = ! state.falseValue;
		},
		toggleContextValue: () => {
			const context = getContext();
			context.value = ! context.value;
		},
	},
} );
