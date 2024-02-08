/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init, getRegionRootFragment, initialVdom } from './init';
import { directivePrefix } from './constants';
import { toVdom } from './vdom';

export { store } from './store';
export { directive, getContext, getElement, getNamespace } from './hooks';
export {
	withScope,
	useWatch,
	useInit,
	useEffect,
	useLayoutEffect,
	useCallback,
	useMemo,
} from './utils';

export { h as createElement, cloneElement, render } from 'preact';
export { useContext, useState, useRef } from 'preact/hooks';
export { deepSignal } from 'deepsignal';

const requiredConsent =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';

export const privateApis = ( lock ) => {
	if ( lock === requiredConsent ) {
		return {
			directivePrefix,
			getRegionRootFragment,
			initialVdom,
			toVdom,
		};
	}

	throw new Error( 'Forbidden access.' );
};

document.addEventListener( 'DOMContentLoaded', async () => {
	registerDirectives();
	await init();
} );
