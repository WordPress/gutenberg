/**
 * External dependencies
 */
import { createElement, Component, cloneElement, Children } from 'react';
import { render, findDOMNode } from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { isString } from 'lodash';

/**
 * Returns a new element of given type. Type can be either a string tag name or
 * another function which itself returns an element.
 *
 * @param  {?(string|Function)} type     Tag name or element creator
 * @param  {Object}             props    Element properties, either attribute
 *                                       set to apply to DOM node or values to
 *                                       pass through to element creator
 * @param  {...WPElement}       children Descendant elements
 * @return {WPElement}                   Element
 */
export { createElement };

/**
 * Renders a given element into the target DOM node.
 *
 * @param {WPElement} element Element to render
 * @param {Element}   target  DOM node into which element should be rendered
 */
export { render };

/**
 * A base class to create WordPress Components (Refs, state and lifecycle hooks)
 */
export { Component };

/**
 * Creates a copy of an element with extended props.
 *
 * @param  {WPElement} element Element
 * @param  {?Object}   props   Props to apply to cloned element
 * @return {WPElement}         Cloned element
 */
export { cloneElement };

/**
 * Finds the dom node of a React component
 *
 * @param {Component} component component's instance
 * @param {Element}   target    DOM node into which element should be rendered
 */
export { findDOMNode };

export { Children };

/**
 * Renders a given element into a string
 *
 * @param  {WPElement} element Element to render
 * @return {String}            HTML
 */
export function renderToString( element ) {
	if ( ! element ) {
		return '';
	}

	if ( 'string' === typeof element ) {
		return element;
	}

	if ( Array.isArray( element ) ) {
		// React 16 supports rendering array children of an element, but not as
		// an argument to the render methods directly. To support this, we pass
		// the array as children of a dummy wrapper, then remove the wrapper's
		// opening and closing tags.
		return renderToStaticMarkup(
			createElement( 'div', null, ...element )
		).slice( 5 /* <div> */, -6 /* </div> */ );
	}

	return renderToStaticMarkup( element );
}

/**
 * Concatenate two or more React children objects
 *
 * @param  {...?Object} childrenArguments Array of children arguments (array of arrays/strings/objects) to concatenate
 * @return {Array}                        The concatenated value
 */
export function concatChildren( ...childrenArguments ) {
	return childrenArguments.reduce( ( memo, children, i ) => {
		Children.forEach( children, ( child, j ) => {
			if ( child && 'string' !== typeof child ) {
				child = cloneElement( child, {
					key: [ i, j ].join(),
				} );
			}

			memo.push( child );
		} );

		return memo;
	}, [] );
}

/**
 * Switches the nodeName of all the elements in the children object
 *
 * @param  {?Object} children  Children object
 * @param  {String}  nodeName  Node name
 * @return {?Object}           The updated children object
 */
export function switchChildrenNodeName( children, nodeName ) {
	return children && Children.map( children, ( elt, index ) => {
		if ( isString( elt ) ) {
			return createElement( nodeName, { key: index }, elt );
		}
		const { children: childrenProp, ...props } = elt.props;
		return createElement( nodeName, { key: index, ...props }, childrenProp );
	} );
}
