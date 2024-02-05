/**
 * WordPress dependencies
 */
import { store, getContext, createElement } from '@wordpress/interactivity';

const { state } = store( 'directive-context', {
	state: {
		text: 'Text 1',
		component: () => (createElement( 'div', {}, state.text )),
		number: 1,
		boolean: true
	},
	actions: {
		toggleStateText() {
			state.text = state.text === 'Text 1' ? 'Text 2' : 'Text 1';
		},
		toggleContextText() {
			const context = getContext();
			context.text = context.text === 'Text 1' ? 'Text 2' : 'Text 1';
		},
	},
} );
