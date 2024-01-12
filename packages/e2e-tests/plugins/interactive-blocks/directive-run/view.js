/**
 * WordPress dependencies
 */
import {
	store,
	directive,
	navigate
} from '@wordpress/interactivity';

// Fake `data-wp-show-mock` directive to test when things are removed from the
// DOM.  Replace with `data-wp-show` when it's ready.
directive(
	'show-mock',
	( { directives: { 'show-mock': showMock }, element, evaluate } ) => {
		const entry = showMock.find( ( { suffix } ) => suffix === 'default' );
		if ( ! evaluate( entry ) ) return null;
		return element;
	}
);

const html = `
<div
	data-wp-interactive='{ "namespace": "directive-run" }'
	data-wp-navigation-id='test-directive-run'
>
	<div data-testid="hydrated" data-wp-text="state.isHydrated"></div>
	<div data-testid="mounted" data-wp-text="state.isMounted"></div>
	<div data-testid="renderCount" data-wp-text="state.renderCount"></div>
	<div data-testid="navigated">yes</div>

	<div
		data-wp-run--hydrated="callbacks.updateIsHydrated"
		data-wp-run--renderCount="callbacks.updateRenderCount"
		data-wp-text="state.clickCount"
	></div>
</div>
`;

const { state } = store( 'directive-run', {
	state: {
		isOpen: false,
		isHydrated: 'no',
		isMounted: 'no',
		renderCount: 0,
		clickCount: 0
	},
	actions: {
		toggle() {
			state.isOpen = ! state.isOpen;
		},
		increment() {
			state.clickCount = state.clickCount + 1;
		},
		navigate() {
			navigate( window.location, {
				force: true,
				html,
			} );
		},
	},
	callbacks: {
		updateIsHydrated() {
			setTimeout( () => ( state.isHydrated = 'yes' ) );
		},
		updateIsMounted() {
			setTimeout( () => ( state.isMounted = 'yes' ) );
		},
		updateRenderCount() {
			setTimeout( () => ( state.renderCount = state.renderCount + 1 ) );
		}
	},
} );
