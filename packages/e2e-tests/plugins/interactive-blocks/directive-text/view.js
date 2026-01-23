/**
 * WordPress dependencies
 */
import { store, getContext, privateApis } from '@wordpress/interactivity';

const { h } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

const { state } = store( 'directive-context', {
	state: {
		text: 'Text 1',
		component: () => h( 'div', {}, state.text ),
		number: 1,
		boolean: true,
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
