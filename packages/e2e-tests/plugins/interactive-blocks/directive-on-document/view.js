/**
 * WordPress dependencies
 */
import { store, privateApis } from '@wordpress/interactivity';

const { directive } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

// Mock `data-wp-show` directive to test when things are removed from the
// DOM.  Replace with `data-wp-show` when it's ready.
directive(
	'show-mock',
	( { directives: { 'show-mock': showMock }, element, evaluate } ) => {
		const entry = showMock.find( ( { suffix } ) => suffix === 'default' );
		if ( ! evaluate( entry ) ) {
			return null;
		}
		return element;
	}
);

const { state } = store( 'directive-on-document', {
	state: {
		counter: 0,
		isVisible: true,
		isEventAttached: 'no',
		keydownHandler: 'no',
		keydownSecondHandler: 'no',
	},
	callbacks: {
		keydownHandler() {
			state.counter += 1;
		},
		init() {
			state.isEventAttached = 'yes';
		},
	},
	actions: {
		visibilityHandler: () => {
			state.isEventAttached = 'no';
			state.isVisible = ! state.isVisible;
		},
		keydownHandler: () => {
			state.keydownHandler = 'yes';
		},
		keydownSecondHandler: () => {
			state.keydownSecondHandler = 'yes';
		},
	},
} );
