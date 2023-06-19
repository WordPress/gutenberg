/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init } from './hydration';
export { store } from './store';

/**
 * Initialize the Interactivity API.
 */
registerDirectives();

document.addEventListener( 'DOMContentLoaded', async () => {
	await init();
} );
