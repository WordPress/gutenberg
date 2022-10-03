/**
 * External dependencies
 */
import { hydrate } from 'preact';

/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import registerComponents from './components';
import toVdom from './vdom';
import { createRootFragment, idle } from './utils';

/**
 * Initialize the initial vDOM.
 */
export default () =>
	document.addEventListener( 'DOMContentLoaded', async () => {
		registerDirectives();
		registerComponents();

		// Create the root fragment to hydrate everything.
		const rootFragment = createRootFragment(
			document.documentElement,
			document.body
		);

		await idle(); // Wait until the CPU is idle to do the hydration.
		const vdom = toVdom( document.body );
		hydrate( vdom, rootFragment );

		// eslint-disable-next-line no-console
		console.log( 'hydrated!' );
	} );
