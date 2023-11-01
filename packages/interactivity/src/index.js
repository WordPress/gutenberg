/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init } from './router';
import { rawStore, afterLoads } from './store';
export { store } from './store';
export { directive } from './hooks';
export { navigate, prefetch } from './router';
export { h as createElement } from 'preact';
export { useEffect, useContext, useMemo } from 'preact/hooks';
export { deepSignal } from 'deepsignal';

document.addEventListener( 'DOMContentLoaded', async () => {
	registerDirectives();
	await init();
	afterLoads.forEach( ( afterLoad ) => afterLoad( rawStore ) );
} );
