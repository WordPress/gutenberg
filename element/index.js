/**
 * External dependencies
 */
import { createElement, Component, cloneElement, Children } from 'react';
import { render, findDOMNode } from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';

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

export { Children };

export { findDOMNode };

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
		return renderToStaticMarkup(
			createElement( 'div', null, ...element )
		).slice( 5, -6 );
	}

	return renderToStaticMarkup( element );
}
