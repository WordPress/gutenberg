/**
 * Internal dependencies
 */
import registerDirectives from './directives';
import { init } from './init';

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
export { directivePrefix } from './constants';
export { toVdom } from './vdom';
export { getRegionRootFragment } from './init';

export { h as createElement, cloneElement, render } from 'preact';
export { useContext, useState, useRef } from 'preact/hooks';
export { deepSignal } from 'deepsignal';

document.addEventListener( 'DOMContentLoaded', async () => {
	registerDirectives();
	await init();
} );
