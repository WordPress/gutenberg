/**
 * WordPress dependencies
 */
import { store, privateApis } from '@wordpress/interactivity';

const { directive } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

// Fake `data-wp-show-mock` directive to test when things are removed from the
// DOM.  Replace with `data-wp-show` when it's ready.
directive(
	'show-mock',
	( { directives: { 'show-mock': showMock }, element, evaluate } ) => {
		const entry = showMock.find( ( { suffix } ) => suffix === null );
		if ( ! evaluate( entry ) ) {
			return null;
		}
		return element;
	}
);

const { state } = store( 'directive-watch', {
	state: {
		isOpen: true,
		isElementInTheDOM: false,
		counter: 0,
		get elementInTheDOM() {
			return state.isElementInTheDOM
				? 'element is in the DOM'
				: 'element is not in the DOM';
		},
	},
	actions: {
		toggle() {
			state.isOpen = ! state.isOpen;
		},
		increment() {
			state.counter = state.counter + 1;
		},
	},
	callbacks: {
		elementAddedToTheDOM: () => {
			state.isElementInTheDOM = true;

			return () => {
				state.isElementInTheDOM = false;
			};
		},
		changeFocus: () => {
			if ( state.isOpen ) {
				document.querySelector( "[data-testid='input']" ).focus();
			}
		},
		infiniteLoop: () => {
			state.counter = state.counter + 1;
		},
	},
} );
