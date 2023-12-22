/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init } from './router';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

export { store } from './store';
export { directive, getContext, getElement } from './hooks';
export { navigate, prefetch } from './router';
export { h as createElement } from 'preact';
export { useEffect, useContext, useMemo } from 'preact/hooks';
export { deepSignal } from 'deepsignal';

domReady( () => {
	registerDirectives();
	return init();
} );
