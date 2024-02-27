/**
 * External dependencies
 */
import { h, cloneElement, render } from 'preact';
import { batch } from '@preact/signals';
import { deepSignal } from 'deepsignal';

/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init, getRegionRootFragment, initialVdom } from './init';
import { directivePrefix } from './constants';
import { toVdom } from './vdom';
import { directive, getNamespace } from './hooks';
import { parseInitialData, populateInitialData } from './store';

export { store, getConfig } from './store';
export { getContext, getElement } from './hooks';
export {
	withScope,
	useWatch,
	useInit,
	useEffect,
	useLayoutEffect,
	useCallback,
	useMemo,
} from './utils';

export { useState, useRef } from 'preact/hooks';

const requiredConsent =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';

export const privateApis = ( lock ): any => {
	if ( lock === requiredConsent ) {
		return {
			directivePrefix,
			getRegionRootFragment,
			initialVdom,
			toVdom,
			directive,
			getNamespace,
			h,
			cloneElement,
			render,
			deepSignal,
			parseInitialData,
			populateInitialData,
			batch,
		};
	}

	throw new Error( 'Forbidden access.' );
};

document.addEventListener( 'DOMContentLoaded', async () => {
	registerDirectives();
	await init();
} );
