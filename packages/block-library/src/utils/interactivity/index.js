/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init as hydrate } from './hydration';
export { store } from './store';

/**
 * Initialize the Interactivity API.
 */
let started = false;
export const init = () => {
	if ( ! started )
		window.addEventListener( 'DOMContentLoaded', () => {
			registerDirectives();
			hydrate();
			// eslint-disable-next-line no-console
			console.log( 'Interactivity API started' );
		} );
	started = true;
};
