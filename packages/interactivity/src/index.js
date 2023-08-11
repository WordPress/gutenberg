/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init } from './hydration';
import { rawStore, afterLoads } from './store';
export { store } from './store';
export { directive } from './hooks';
export { h as createElement } from 'preact';
export { useEffect, useContext, useMemo } from 'preact/hooks';
export { deepSignal } from 'deepsignal';

/**
 * Initialize the Interactivity API.
 */
registerDirectives();

document.addEventListener( 'DOMContentLoaded', async () => {
	await init();
	afterLoads.forEach( ( afterLoad ) => afterLoad( rawStore ) );
} );
