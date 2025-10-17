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
import { effect, signal } from '@preact/signals';

/**
 * Internal dependencies
 */
import { getScope, setScope, resetScope } from './scopes';
import { getNamespace, setNamespace, resetNamespace } from './namespaces';

interface Flusher {
	readonly flush: () => void;
	readonly dispose: () => void;
}

declare global {
	interface Window {
		scheduler?: {
			readonly yield?: () => Promise< void >;
		};
	}
}

export interface SyncAwareFunction extends Function {
	sync?: boolean;
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
 * @return Promise<void>
 */
export const splitTask =
	typeof window.scheduler?.yield === 'function'
		? window.scheduler.yield.bind( window.scheduler )
		: () => {
				return new Promise( ( resolve ) => {
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
function createFlusher( compute: () => void, notify: () => void ): Flusher {
	let flush: () => void = () => undefined;
	const dispose = effect( function ( this: any ): void {
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
 * Asynchronous functions should use generators that yield promises instead of awaiting them.
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
export function withScope< Func extends SyncAwareFunction >( func: Func ): Func;
export function withScope( func: ( ...args: unknown[] ) => unknown ) {
	const scope = getScope();
	const ns = getNamespace();

	let wrapped: Function;
	if ( func?.constructor?.name === 'GeneratorFunction' ) {
		wrapped = async ( ...args: Parameters< typeof func > ) => {
			const gen = func( ...args ) as Generator;
			let value: any;
			let it: any;
			let error: any;
			while ( true ) {
				setNamespace( ns );
				setScope( scope );
				try {
					it = error ? gen.throw( error ) : gen.next( value );
					error = undefined;
				} catch ( e ) {
					throw e;
				} finally {
					resetScope();
					resetNamespace();
				}

				try {
					value = await it.value;
				} catch ( e ) {
					error = e;
				}
				if ( it.done ) {
					if ( error ) {
						throw error;
					} else {
						break;
					}
				}
			}

			return value;
		};
	} else {
		wrapped = ( ...args: Parameters< typeof func > ) => {
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

	// If function was annotated via `withSyncEvent()`, maintain the annotation.
	const syncAware = func as SyncAwareFunction;
	if ( syncAware.sync ) {
		const syncAwareWrapped = wrapped as SyncAwareFunction;
		syncAwareWrapped.sync = true;
		return syncAwareWrapped;
	}

	return wrapped;
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
 * element's first render, mainly useful for initialization logic.
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
 * Returns the memoized output of the passed factory function, allowing access
 * to the current element's scope.
 *
 * This hook is equivalent to Preact's `useMemo` and makes the element's scope
 * available so functions like `getElement()` and `getContext()` can be used
 * inside the passed factory function. Note that `useMemo` will only recompute
 * the memoized value when one of the inputs has changed.
 *
 * @param factory Factory function that returns that value for memoization.
 * @param inputs  If present, the factory will only be run to recompute if the
 *                values in the list change (using `===`).
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
		contains( c: Node ) {
			parent.contains( c );
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

/**
 * Indicates that the passed `callback` requires synchronous access to the event object.
 *
 * @param callback The event callback.
 * @return Altered event callback.
 */
export function withSyncEvent( callback: Function ): SyncAwareFunction {
	const syncAware = callback as SyncAwareFunction;
	syncAware.sync = true;
	return syncAware;
}

export type DeepReadonly< T > = T extends ( ...args: any[] ) => any
	? T
	: T extends object
	? { readonly [ K in keyof T ]: DeepReadonly< T[ K ] > }
	: T;

// WeakMap cache to reuse proxies for the same read-only objects.
const readOnlyMap = new WeakMap< object, object >();

/**
 * Creates a proxy handler that prevents any modifications to the target object.
 *
 * @param errorMessage Custom error message to display when modification is attempted.
 * @return Proxy handler for read-only behavior.
 */
const createDeepReadOnlyHandlers = (
	errorMessage: string
): ProxyHandler< object > => {
	const handleError = () => {
		if ( globalThis.SCRIPT_DEBUG ) {
			warn( errorMessage );
		}
		return false;
	};

	return {
		get( target, prop ) {
			const value = target[ prop ];
			if ( value && typeof value === 'object' ) {
				return deepReadOnly( value, { errorMessage } );
			}
			return value;
		},
		set: handleError,
		deleteProperty: handleError,
		defineProperty: handleError,
	};
};

/**
 * Creates a deeply read-only proxy of an object.
 *
 * This function recursively wraps an object and all its nested objects in
 * proxies that prevent any modifications. All mutation operations (`set`,
 * `deleteProperty`, and `defineProperty`) will silently fail in production and
 * emit warnings in development (when `globalThis.SCRIPT_DEBUG` is true).
 *
 * The wrapping is lazy: nested objects are only wrapped when accessed, making
 * this efficient for large or deeply nested structures.
 *
 * Proxies are cached using a WeakMap, so calling this function multiple times
 * with the same object will return the same proxy instance.
 *
 * @param obj                  The object to make read-only.
 * @param options              Optional configuration.
 * @param options.errorMessage Custom error message to display when modification is attempted.
 * @return A read-only proxy of the object.
 */
export function deepReadOnly< T extends object >(
	obj: T,
	options?: { errorMessage?: string }
): T {
	const errorMessage =
		options?.errorMessage ?? 'Cannot modify read-only object';

	if ( ! readOnlyMap.has( obj ) ) {
		const handlers = createDeepReadOnlyHandlers( errorMessage );
		readOnlyMap.set( obj, new Proxy( obj, handlers ) );
	}

	return readOnlyMap.get( obj ) as T;
}

export const navigationSignal = signal( 0 );
