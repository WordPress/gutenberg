/**
 * External dependencies
 */
import type { h as createElement, RefObject } from 'preact';

/**
 * Internal dependencies
 */
import { getNamespace } from './namespaces';
import type { Evaluate } from './hooks';

export interface Scope {
	evaluate: Evaluate;
	context: object;
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

// Wrap the element props to prevent modifications.
const immutableMap = new WeakMap();
const immutableError = () => {
	throw new Error(
		'Please use `data-wp-bind` to modify the attributes of an element.'
	);
};
const immutableHandlers: ProxyHandler< object > = {
	get( target, key, receiver ) {
		const value = Reflect.get( target, key, receiver );
		return !! value && typeof value === 'object'
			? deepImmutable( value )
			: value;
	},
	set: immutableError,
	deleteProperty: immutableError,
};
const deepImmutable = < T extends object = {} >( target: T ): T => {
	if ( ! immutableMap.has( target ) ) {
		immutableMap.set( target, new Proxy( target, immutableHandlers ) );
	}
	return immutableMap.get( target );
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
	if ( ! scope ) {
		throw Error(
			'Cannot call `getContext()` outside getters and actions used by directives.'
		);
	}
	return scope.context[ namespace || getNamespace() ];
};

/**
 * Retrieves a representation of the element where a function from the store
 * is being evalutated. Such representation is read-only, and contains a
 * reference to the DOM element, its props and a local reactive state.
 *
 * @return Element representation.
 */
export const getElement = () => {
	if ( ! getScope() ) {
		throw Error(
			'Cannot call `getElement()` outside getters and actions used by directives.'
		);
	}
	const { ref, attributes } = getScope();
	return Object.freeze( {
		ref: ref.current,
		attributes: deepImmutable( attributes ),
	} );
};
