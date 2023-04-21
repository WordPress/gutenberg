/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init } from './hydration';

/**
 * Initialize the Interactivity API.
 */
export default () => {
	window.addEventListener( 'DOMContentLoaded', () => {
		registerDirectives();
		init();
		// eslint-disable-next-line no-console
		console.log( 'hydrated!' );
	} );
};
