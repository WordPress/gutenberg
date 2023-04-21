/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init } from './hydration';

/**
 * Initialize the Interactivity API.
 */
registerDirectives();
init();
