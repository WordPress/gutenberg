/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init } from './router';

document.addEventListener( 'DOMContentLoaded', async () => {
	registerDirectives();
	await init();
	console.log( 'hydrated!' );
} );
