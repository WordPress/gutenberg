/**
 * WordPress dependencies
 */
import { store, directive, getContext } from '@wordpress/interactivity';

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

const { state } = store( 'directive-on-window', {
	state: {
		counter: 0,
	},
	callbacks: {
		resizeHandler: ( ) => {
			state.counter += 1;
		},
	},
	actions: {
		visibilityHandler: () => {
			const context = getContext();
			context.isVisible = ! context.isVisible;
		},
	}
} );
