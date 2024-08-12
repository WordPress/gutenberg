/**
 * External dependencies
 */
import {
	useMemo as _useMemo,
	useCallback as _useCallback,
	useEffect as _useEffect,
	useLayoutEffect as _useLayoutEffect,
	type EffectCallback,
	type Inputs,
} from 'preact/hooks';
import { effect } from '@preact/signals';

/**
 * Internal dependencies
 */
import { getScope, setScope, resetScope } from './scopes';
import { getNamespace, setNamespace, resetNamespace } from './namespaces';

interface Flusher {
	readonly flush: () => void;
	readonly dispose: () => void;
}

/**
 * Executes a callback function after the next frame is rendered.
 *
 * @param callback The callback function to be executed.
 * @return A promise that resolves after the callback function is executed.
 */
const afterNextFrame = ( callback: () => void ) => {
	return new Promise< void >( ( resolve ) => {
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

/**
 * Returns a promise that resolves after yielding to main.
 *
 * @return Promise
 */
export const splitTask = () => {
	return new Promise( ( resolve ) => {
		// TODO: Use scheduler.yield() when available.
		setTimeout( resolve, 0 );
	} );
};

/**
 * Creates a Flusher object that can be used to flush computed values and notify listeners.
 *
 * Using the mangled properties:
 * this.c: this._callback
 * this.x: this._compute
 * https://github.com/preactjs/signals/blob/main/mangle.json
 *
 * @param compute The function that computes the value to be flushed.
 * @param notify  The function that notifies listeners when the value is flushed.
 * @return The Flusher object with `flush` and `dispose` properties.
 */
function createFlusher( compute: () => unknown, notify: () => void ): Flusher {
	let flush: () => void = () => undefined;
	const dispose = effect( function ( this: any ) {
		flush = this.c.bind( this );
		this.x = compute;
		this.c = notify;
		return compute();
	} );
	return { flush, dispose } as const;
}

/**
 * Custom hook that executes a callback function whenever a signal is triggered.
 * Version of `useSignalEffect` with a `useEffect`-like execution. This hook
 * implementation comes from this PR, but we added short-cirtuiting to avoid
 * infinite loops: https://github.com/preactjs/signals/pull/290
 *
 * @param callback The callback function to be executed.
 */
export function useSignalEffect( callback: () => unknown ) {
	_useEffect( () => {
		let eff: Flusher | null = null;
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
 * Asyncronous functions should use generators that yield promises instead of awaiting them.
 * See the documentation for details: https://developer.wordpress.org/block-editor/reference-guides/packages/packages-interactivity/packages-interactivity-api-reference/#the-store
 *
 * @param func The passed function.
 * @return The wrapped function.
 */
export function withScope<
	Func extends ( ...args: any[] ) => Generator< any, any >,
>(
	func: Func
): (
	...args: Parameters< Func >
) => ReturnType< Func > extends Generator< any, infer Return >
	? Promise< Return >
	: never;
export function withScope< Func extends Function >( func: Func ): Func;
export function withScope( func: ( ...args: unknown[] ) => unknown ) {
	const scope = getScope();
	const ns = getNamespace();
	if ( func?.constructor?.name === 'GeneratorFunction' ) {
		return async ( ...args: Parameters< typeof func > ) => {
			const gen = func( ...args ) as Generator;
			let value: any;
			let it: any;
			while ( true ) {
				setNamespace( ns );
				setScope( scope );
				try {
					it = gen.next( value );
				} finally {
					resetScope();
					resetNamespace();
				}

				try {
					value = await it.value;
				} catch ( e ) {
					setNamespace( ns );
					setScope( scope );
					gen.throw( e );
				} finally {
					resetScope();
					resetNamespace();
				}

				if ( it.done ) {
					break;
				}
			}

			return value;
		};
	}
	return ( ...args: Parameters< typeof func > ) => {
		setNamespace( ns );
		setScope( scope );
		try {
			return func( ...args );
		} finally {
			resetNamespace();
			resetScope();
		}
	};
}

/**
 * Accepts a function that contains imperative code which runs whenever any of
 * the accessed _reactive_ properties (e.g., values from the global state or the
 * context) is modified.
 *
 * This hook makes the element's scope available so functions like
 * `getElement()` and `getContext()` can be used inside the passed callback.
 *
 * @param callback The hook callback.
 */
export function useWatch( callback: () => unknown ) {
	useSignalEffect( withScope( callback ) );
}

/**
 * Accepts a function that contains imperative code which runs only after the
 * element's first render, mainly useful for intialization logic.
 *
 * This hook makes the element's scope available so functions like
 * `getElement()` and `getContext()` can be used inside the passed callback.
 *
 * @param callback The hook callback.
 */
export function useInit( callback: EffectCallback ) {
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
 * @param callback Imperative function that can return a cleanup
 *                 function.
 * @param inputs   If present, effect will only activate if the
 *                 values in the list change (using `===`).
 */
export function useEffect( callback: EffectCallback, inputs: Inputs ) {
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
 * @param callback Imperative function that can return a cleanup
 *                 function.
 * @param inputs   If present, effect will only activate if the
 *                 values in the list change (using `===`).
 */
export function useLayoutEffect( callback: EffectCallback, inputs: Inputs ) {
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
 * @param callback Callback function.
 * @param inputs   If present, the callback will only be updated if the
 *                 values in the list change (using `===`).
 *
 * @return The callback function.
 */
export function useCallback< T extends Function >(
	callback: T,
	inputs: Inputs
): T {
	return _useCallback< T >( withScope( callback ), inputs );
}

/**
 * Pass a factory function and an array of inputs. `useMemo` will only recompute
 * the memoized value when one of the inputs has changed.
 *
 * This hook is equivalent to Preact's `useMemo` and makes the element's scope
 * available so functions like `getElement()` and `getContext()` can be used
 * inside the passed factory function.
 *
 * @param factory Factory function that returns that value for memoization.
 * @param inputs  If present, the factory will only be run to recompute if
 *                the values in the list change (using `===`).
 *
 * @return The memoized value.
 */
export function useMemo< T >( factory: () => T, inputs: Inputs ): T {
	return _useMemo( withScope( factory ), inputs );
}

/**
 * Creates a root fragment by replacing a node or an array of nodes in a parent element.
 * For wrapperless hydration.
 * See https://gist.github.com/developit/f4c67a2ede71dc2fab7f357f39cff28c
 *
 * @param parent      The parent element where the nodes will be replaced.
 * @param replaceNode The node or array of nodes to replace in the parent element.
 * @return The created root fragment.
 */
export const createRootFragment = (
	parent: Element,
	replaceNode: Node | Node[]
) => {
	replaceNode = ( [] as Node[] ).concat( replaceNode );
	const sibling = replaceNode[ replaceNode.length - 1 ].nextSibling;
	function insert( child: any, root: any ) {
		parent.insertBefore( child, root || sibling );
	}
	return ( ( parent as any ).__k = {
		nodeType: 1,
		parentNode: parent,
		firstChild: replaceNode[ 0 ],
		childNodes: replaceNode,
		insertBefore: insert,
		appendChild: insert,
		removeChild( c: Node ) {
			parent.removeChild( c );
		},
	} );
};

/**
 * Transforms a kebab-case string to camelCase.
 *
 * @param str The kebab-case string to transform to camelCase.
 * @return The transformed camelCase string.
 */
export function kebabToCamelCase( str: string ): string {
	return str
		.replace( /^-+|-+$/g, '' )
		.toLowerCase()
		.replace( /-([a-z])/g, function ( _match, group1: string ) {
			return group1.toUpperCase();
		} );
}

const logged: Set< string > = new Set();

/**
 * Shows a warning with `message` if environment is not `production`.
 *
 * Based on the `@wordpress/warning` package.
 *
 * @param message Message to show in the warning.
 */
export const warn = ( message: string ): void => {
	if ( globalThis.SCRIPT_DEBUG ) {
		if ( logged.has( message ) ) {
			return;
		}

		// eslint-disable-next-line no-console
		console.warn( message );

		// Throwing an error and catching it immediately to improve debugging
		// A consumer can use 'pause on caught exceptions'
		try {
			throw Error( message );
		} catch ( e ) {
			// Do nothing.
		}
		logged.add( message );
	}
};

/**
 * Checks if the passed `candidate` is a plain object with just the `Object`
 * prototype.
 *
 * @param candidate The item to check.
 * @return Whether `candidate` is a plain object.
 */
export const isPlainObject = (
	candidate: unknown
): candidate is Record< string, unknown > =>
	Boolean(
		candidate &&
			typeof candidate === 'object' &&
			candidate.constructor === Object
	);

export const deepMerge = (
	target: any,
	source: any,
	override: boolean = true
) => {
	if ( isPlainObject( target ) && isPlainObject( source ) ) {
		for ( const key in source ) {
			const desc = Object.getOwnPropertyDescriptor( source, key );
			if (
				typeof desc?.get === 'function' ||
				typeof desc?.set === 'function'
			) {
				if ( override || ! ( key in target ) ) {
					Object.defineProperty( target, key, {
						...desc,
						configurable: true,
						enumerable: true,
					} );
				}
			} else if ( isPlainObject( source[ key ] ) ) {
				if ( ! target[ key ] ) {
					target[ key ] = {};
				}
				deepMerge( target[ key ], source[ key ], override );
			} else if ( override || ! ( key in target ) ) {
				Object.defineProperty( target, key, desc! );
			}
		}
	}
};
