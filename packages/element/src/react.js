/**
 * External dependencies
 */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
	Children,
	cloneElement,
	Component,
	createContext,
	createElement,
	createRef,
	forwardRef,
	Fragment,
	isValidElement,
	memo,
	PureComponent,
	StrictMode,
	useCallback,
	useContext,
	useDebugValue,
	useDeferredValue,
	useEffect,
	useId,
	useMemo,
	useImperativeHandle,
	useInsertionEffect,
	useLayoutEffect,
	useReducer,
	useRef,
	useState,
	useSyncExternalStore,
	useTransition,
	startTransition,
	lazy,
	Suspense,
} from 'react';

/**
 * Object containing a React element.
 *
 * @typedef {import('react').ReactElement} Element
 */

/**
 * Object containing a React component.
 *
 * @typedef {import('react').ComponentType} ComponentType
 */

/**
 * Object containing a React synthetic event.
 *
 * @typedef {import('react').SyntheticEvent} SyntheticEvent
 */

/**
 * Object containing a React ref object.
 *
 * @template T
 * @typedef {import('react').RefObject<T>} RefObject<T>
 */

/**
 * Object containing a React ref callback.
 *
 * @template T
 * @typedef {import('react').RefCallback<T>} RefCallback<T>
 */

/**
 * Object containing a React ref.
 *
 * @template T
 * @typedef {import('react').Ref<T>} Ref<T>
 */

/**
 * Object that provides utilities for dealing with React children.
 */
export { Children };

/**
 * Creates a copy of an element with extended props.
 *
 * @param {Element} element Element
 * @param {?Object} props   Props to apply to cloned element
 *
 * @return {Element} Cloned element.
 */
export { cloneElement };

/**
 * A base class to create WordPress Components (Refs, state and lifecycle hooks)
 */
export { Component };

/**
 * Creates a context object containing two components: a provider and consumer.
 *
 * @param {Object} defaultValue A default data stored in the context.
 *
 * @return {Object} Context object.
 */
export { createContext };

/**
 * Returns a new element of given type. Type can be either a string tag name or
 * another function which itself returns an element.
 *
 * @param {?(string|Function)} type     Tag name or element creator
 * @param {Object}             props    Element properties, either attribute
 *                                      set to apply to DOM node or values to
 *                                      pass through to element creator
 * @param {...Element}         children Descendant elements
 *
 * @return {Element} Element.
 */
export { createElement };

/**
 * Returns an object tracking a reference to a rendered element via its
 * `current` property as either a DOMElement or Element, dependent upon the
 * type of element rendered with the ref attribute.
 *
 * @return {Object} Ref object.
 */
export { createRef };

/**
 * Component enhancer used to enable passing a ref to its wrapped component.
 * Pass a function argument which receives `props` and `ref` as its arguments,
 * returning an element using the forwarded ref. The return value is a new
 * component which forwards its ref.
 *
 * @param {Function} forwarder Function passed `props` and `ref`, expected to
 *                             return an element.
 *
 * @return {Component} Enhanced component.
 */
export { forwardRef };

/**
 * A component which renders its children without any wrapping element.
 */
export { Fragment };

/**
 * Checks if an object is a valid React Element.
 *
 * @param {Object} objectToCheck The object to be checked.
 *
 * @return {boolean} true if objectToTest is a valid React Element and false otherwise.
 */
export { isValidElement };

/**
 * @see https://react.dev/reference/react/memo
 */
export { memo };

/**
 * Component that activates additional checks and warnings for its descendants.
 */
export { StrictMode };

/**
 * @see https://react.dev/reference/react/useCallback
 */
export { useCallback };

/**
 * @see https://react.dev/reference/react/useContext
 */
export { useContext };

/**
 * @see https://react.dev/reference/react/useDebugValue
 */
export { useDebugValue };

/**
 * @see https://react.dev/reference/react/useDeferredValue
 */
export { useDeferredValue };

/**
 * @see https://react.dev/reference/react/useEffect
 */
export { useEffect };

/**
 * @see https://react.dev/reference/react/useId
 */
export { useId };

/**
 * @see https://react.dev/reference/react/useImperativeHandle
 */
export { useImperativeHandle };

/**
 * @see https://react.dev/reference/react/useInsertionEffect
 */
export { useInsertionEffect };

/**
 * @see https://react.dev/reference/react/useLayoutEffect
 */
export { useLayoutEffect };

/**
 * @see https://react.dev/reference/react/useMemo
 */
export { useMemo };

/**
 * @see https://react.dev/reference/react/useReducer
 */
export { useReducer };

/**
 * @see https://react.dev/reference/react/useRef
 */
export { useRef };

/**
 * @see https://react.dev/reference/react/useState
 */
export { useState };

/**
 * @see https://react.dev/reference/react/useSyncExternalStore
 */
export { useSyncExternalStore };

/**
 * @see https://react.dev/reference/react/useTransition
 */
export { useTransition };

/**
 * @see https://react.dev/reference/react/startTransition
 */
export { startTransition };

/**
 * @see https://react.dev/reference/react/lazy
 */
export { lazy };

/**
 * @see https://react.dev/reference/react/Suspense
 */
export { Suspense };

/**
 * @see https://react.dev/reference/react/PureComponent
 */
export { PureComponent };

/**
 * Concatenate two or more React children objects.
 *
 * @param {...?Object} childrenArguments Array of children arguments (array of arrays/strings/objects) to concatenate.
 *
 * @return {Array} The concatenated value.
 */
export function concatChildren( ...childrenArguments ) {
	return childrenArguments.reduce( ( accumulator, children, i ) => {
		Children.forEach( children, ( child, j ) => {
			if ( child && 'string' !== typeof child ) {
				child = cloneElement( child, {
					key: [ i, j ].join(),
				} );
			}

			accumulator.push( child );
		} );

		return accumulator;
	}, [] );
}

/**
 * Switches the nodeName of all the elements in the children object.
 *
 * @param {?Object} children Children object.
 * @param {string}  nodeName Node name.
 *
 * @return {?Object} The updated children object.
 */
export function switchChildrenNodeName( children, nodeName ) {
	return (
		children &&
		Children.map( children, ( elt, index ) => {
			if ( typeof elt?.valueOf() === 'string' ) {
				return createElement( nodeName, { key: index }, elt );
			}
			const { children: childrenProp, ...props } = elt.props;
			return createElement(
				nodeName,
				{ key: index, ...props },
				childrenProp
			);
		} )
	);
}
