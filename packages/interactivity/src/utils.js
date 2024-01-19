/**
 * External dependencies
 */
import {
	useMemo as _useMemo,
	useCallback as _useCallback,
	useEffect as _useEffect,
	useLayoutEffect as _useLayoutEffect,
} from 'preact/hooks';
import { effect } from '@preact/signals';

/**
 * Internal dependencies
 */
import {
	getScope,
	setScope,
	resetScope,
	getNamespace,
	setNamespace,
	resetNamespace,
} from './hooks';

const afterNextFrame = ( callback ) => {
	return new Promise( ( resolve ) => {
		const done = () => {
			clearTimeout( timeout );
			window.cancelAnimationFrame( raf );
			setTimeout( () => {
				callback();
				resolve();
			} );
		};
		const timeout = setTimeout( done, 100 );
		const raf = window.requestAnimationFrame( done );
	} );
};

// Using the mangled properties:
// this.c: this._callback
// this.x: this._compute
// https://github.com/preactjs/signals/blob/main/mangle.json
function createFlusher( compute, notify ) {
	let flush;
	const dispose = effect( function () {
		flush = this.c.bind( this );
		this.x = compute;
		this.c = notify;
		return compute();
	} );
	return { flush, dispose };
}

// Version of `useSignalEffect` with a `useEffect`-like execution. This hook
// implementation comes from this PR, but we added short-cirtuiting to avoid
// infinite loops: https://github.com/preactjs/signals/pull/290
export function useSignalEffect( callback ) {
	_useEffect( () => {
		let eff = null;
		let isExecuting = false;
		const notify = async () => {
			if ( eff && ! isExecuting ) {
				isExecuting = true;
				await afterNextFrame( eff.flush );
				isExecuting = false;
			}
		};
		eff = createFlusher( callback, notify );
		return eff.dispose;
	}, [] );
}

/**
 * Returns the passed function wrapped with the current scope so it is
 * accessible whenever the function runs. This is primarily to make the scope
 * available inside hook callbacks.
 *
 * @param {Function} func The passed function.
 * @return {Function} The wrapped function.
 */
export const withScope = ( func ) => {
	const scope = getScope();
	const ns = getNamespace();
	if ( func?.constructor?.name === 'GeneratorFunction' ) {
		return async ( ...args ) => {
			const gen = func( ...args );
			let value;
			let it;
			while ( true ) {
				setNamespace( ns );
				setScope( scope );
				try {
					it = gen.next( value );
				} finally {
					resetNamespace();
					resetScope();
				}
				try {
					value = await it.value;
				} catch ( e ) {
					gen.throw( e );
				}
				if ( it.done ) break;
			}
			return value;
		};
	}
	return ( ...args ) => {
		setNamespace( ns );
		setScope( scope );
		try {
			return func( ...args );
		} finally {
			resetNamespace();
			resetScope();
		}
	};
};

/**
 * Accepts a function that contains imperative code which runs whenever any of
 * the accessed _reactive_ properties (e.g., values from the global state or the
 * context) is modified.
 *
 * This hook makes the element's scope available so functions like
 * `getElement()` and `getContext()` can be used inside the passed callback.
 *
 * @param {Function} callback The hook callback.
 */
export function useWatch( callback ) {
	useSignalEffect( withScope( callback ) );
}

/**
 * Accepts a function that contains imperative code which runs only after the
 * element's first render, mainly useful for intialization logic.
 *
 * This hook makes the element's scope available so functions like
 * `getElement()` and `getContext()` can be used inside the passed callback.
 *
 * @param {Function} callback The hook callback.
 */
export function useInit( callback ) {
	_useEffect( withScope( callback ), [] );
}

/**
 * Accepts a function that contains imperative, possibly effectful code. The
 * effects run after browser paint, without blocking it.
 *
 * This hook is equivalent to Preact's `useEffect` and makes the element's scope
 * available so functions like `getElement()` and `getContext()` can be used
 * inside the passed callback.
 *
 * @param {Function} callback Imperative function that can return a cleanup
 *                            function.
 * @param {any[]}    inputs   If present, effect will only activate if the
 *                            values in the list change (using `===`).
 */
export function useEffect( callback, inputs ) {
	_useEffect( withScope( callback ), inputs );
}

/**
 * Accepts a function that contains imperative, possibly effectful code. Use
 * this to read layout from the DOM and synchronously re-render.
 *
 * This hook is equivalent to Preact's `useLayoutEffect` and makes the element's
 * scope available so functions like `getElement()` and `getContext()` can be
 * used inside the passed callback.
 *
 * @param {Function} callback Imperative function that can return a cleanup
 *                            function.
 * @param {any[]}    inputs   If present, effect will only activate if the
 *                            values in the list change (using `===`).
 */
export function useLayoutEffect( callback, inputs ) {
	_useLayoutEffect( withScope( callback ), inputs );
}

/**
 * Returns a memoized version of the callback that only changes if one of the
 * inputs has changed (using `===`).
 *
 * This hook is equivalent to Preact's `useCallback` and makes the element's
 * scope available so functions like `getElement()` and `getContext()` can be
 * used inside the passed callback.
 *
 * @param {Function} callback Imperative function that can return a cleanup
 *                            function.
 * @param {any[]}    inputs   If present, effect will only activate if the
 *                            values in the list change (using `===`).
 */
export function useCallback( callback, inputs ) {
	_useCallback( withScope( callback ), inputs );
}

/**
 * Pass a factory function and an array of inputs. `useMemo` will only recompute
 * the memoized value when one of the inputs has changed.
 *
 * This hook is equivalent to Preact's `useMemo` and makes the element's scope
 * available so functions like `getElement()` and `getContext()` can be used
 * inside the passed factory function.
 *
 * @param {Function} factory Imperative function that can return a cleanup
 *                           function.
 * @param {any[]}    inputs  If present, effect will only activate if the
 *                           values in the list change (using `===`).
 */
export function useMemo( factory, inputs ) {
	_useMemo( withScope( factory ), inputs );
}

// For wrapperless hydration.
// See https://gist.github.com/developit/f4c67a2ede71dc2fab7f357f39cff28c
export const createRootFragment = ( parent, replaceNode ) => {
	replaceNode = [].concat( replaceNode );
	const s = replaceNode[ replaceNode.length - 1 ].nextSibling;
	function insert( c, r ) {
		parent.insertBefore( c, r || s );
	}
	return ( parent.__k = {
		nodeType: 1,
		parentNode: parent,
		firstChild: replaceNode[ 0 ],
		childNodes: replaceNode,
		insertBefore: insert,
		appendChild: insert,
		removeChild( c ) {
			parent.removeChild( c );
		},
	} );
};
