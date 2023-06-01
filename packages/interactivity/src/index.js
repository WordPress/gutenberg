/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init } from './hydration';
export { store } from './store';
export { directive } from './hooks';
export * as preact from 'preact';
export * as preactHooks from 'preact/hooks';
export { deepSignal } from 'deepsignal';

/**
 * Initialize the Interactivity API.
 */
registerDirectives();

document.addEventListener( 'DOMContentLoaded', async () => {
	await init();
	// eslint-disable-next-line no-console
	console.log( 'Interactivity API started' );
} );
