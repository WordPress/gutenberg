/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init } from './router';

export { store } from './store';
export { directive, getContext, getElement } from './hooks';
export { navigate, prefetch } from './router';
export { h as createElement } from 'preact';
export { useEffect, useContext, useMemo } from 'preact/hooks';
export { deepSignal } from 'deepsignal';

document.addEventListener( 'DOMContentLoaded', async () => {
	registerDirectives();
	await init();
} );
