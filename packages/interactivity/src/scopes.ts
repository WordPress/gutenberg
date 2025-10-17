/**
 * External dependencies
 */
import type { h as createElement, RefObject } from 'preact';

/**
 * Internal dependencies
 */
import { getNamespace } from './namespaces';
import { deepReadOnly, navigationSignal } from './utils';
import type { DeepReadonly } from './utils';
import type { Evaluate } from './hooks';

export interface Scope {
	evaluate: Evaluate;
	context: object;
	serverContext: object;
	ref: RefObject< HTMLElement >;
	attributes: createElement.JSX.HTMLAttributes;
}

// Store stacks for the current scope and the default namespaces and export APIs
// to interact with them.
const scopeStack: Scope[] = [];

export const getScope = () => scopeStack.slice( -1 )[ 0 ];

export const setScope = ( scope: Scope ) => {
	scopeStack.push( scope );
};
export const resetScope = () => {
	scopeStack.pop();
};

const throwNotInScope = ( method: string ) => {
	throw Error(
		`Cannot call \`${ method }()\` when there is no scope. If you are using an async function, please consider using a generator instead. If you are using some sort of async callbacks, like \`setTimeout\`, please wrap the callback with \`withScope(callback)\`.`
	);
};

/**
 * Retrieves the context inherited by the element evaluating a function from the
 * store. The returned value depends on the element and the namespace where the
 * function calling `getContext()` exists.
 *
 * @param namespace Store namespace. By default, the namespace where the calling
 *                  function exists is used.
 * @return The context content.
 */
export const getContext = < T extends object >( namespace?: string ): T => {
	const scope = getScope();
	if ( globalThis.SCRIPT_DEBUG ) {
		if ( ! scope ) {
			throwNotInScope( 'getContext' );
		}
	}
	return scope.context[ namespace || getNamespace() ];
};

/**
 * Retrieves a representation of the element where a function from the store
 * is being evaluated. Such representation is read-only, and contains a
 * reference to the DOM element, its props and a local reactive state.
 *
 * @return Element representation.
 */
export const getElement = () => {
	const scope = getScope();
	let deepReadOnlyOptions = {};
	if ( globalThis.SCRIPT_DEBUG ) {
		if ( ! scope ) {
			throwNotInScope( 'getElement' );
		}
		deepReadOnlyOptions = {
			errorMessage:
				"Don't mutate the attributes from `getElement`, use `data-wp-bind` to modify the attributes of an element instead.",
		};
	}
	const { ref, attributes } = scope;
	return Object.freeze( {
		ref: ref.current,
		attributes: deepReadOnly( attributes, deepReadOnlyOptions ),
	} );
};

/**
 * Gets the context defined and updated from the server.
 *
 * The object returned is read-only, and includes the context defined in PHP
 * with `data-wp-context` directives, including the corresponding inherited
 * properties. When `actions.navigate()` is called, this object is updated to
 * reflect the changes in the new visited page, without affecting the context
 * returned by `getContext()`. Directives can subscribe to those changes to
 * update the context if needed.
 *
 * @example
 * ```js
 *  store( 'myPlugin', {
 *    callbacks: {
 *      updateServerContext() {
 *        const context = getContext();
 *        const serverContext = getServerContext();
 *        // Override some property with the new value that came from the server.
 *        context.overridableProp = serverContext.overridableProp;
 *      },
 *    },
 *  } );
 * ```
 *
 * @param namespace Store namespace. By default, it inherits the namespace of
 *                  the store where it is defined.
 * @return The server context content for the given namespace.
 */
export function getServerContext(
	namespace?: string
): DeepReadonly< Record< string, unknown > >;
export function getServerContext< T extends object >(
	namespace?: string
): DeepReadonly< T >;
export function getServerContext< T extends object >(
	namespace?: string
): DeepReadonly< T > {
	const scope = getScope();

	if ( globalThis.SCRIPT_DEBUG ) {
		if ( ! scope ) {
			throwNotInScope( 'getServerContext' );
		}
	}

	// Accesses the signal to make this reactive. It assigns it to `subscribe`
	// to prevent the JavaScript minifier from removing this line.
	getServerContext.subscribe = navigationSignal.value;

	return scope.serverContext[ namespace || getNamespace() ];
}
getServerContext.subscribe = 0;
