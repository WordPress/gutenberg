/**
 * WordPress dependencies
 */
import { store, getContext, privateApis } from '@wordpress/interactivity';

const { directive } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

// Mock `data-wp-show` directive to test when things are removed from the
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

store( 'directive-init', {
	state: {
		get isReady() {
			const { isReady } = getContext();
			return isReady.map( ( v ) => ( v ? 'true' : 'false' ) ).join( ',' );
		},
		get calls() {
			const { calls } = getContext();
			return calls.join( ',' );
		},
		get isMounted() {
			const { isMounted } = getContext();
			return isMounted ? 'true' : 'false';
		},
	},
	actions: {
		initOne() {
			const { isReady, calls } = getContext();
			isReady[ 0 ] = true;
			// Subscribe to changes in that prop.
			calls[ 0 ]++;
		},
		initTwo() {
			const { isReady, calls } = getContext();
			isReady[ 1 ] = true;
			calls[ 1 ]++;
		},
		initMount() {
			const ctx = getContext();
			ctx.isMounted = true;
			return () => {
				ctx.isMounted = false;
			};
		},
		reset() {
			const { isReady } = getContext();
			isReady.fill( false );
		},
		toggle() {
			const ctx = getContext();
			ctx.isVisible = ! ctx.isVisible;
		},
	},
} );
