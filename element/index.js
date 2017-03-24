/**
 * External dependencies
 */
import { createElement as reactCreateElement } from 'react';
import { render as reactRender } from 'react-dom';

/**
 * Returns a new element of given type. Type can be either a string tag name or
 * another function which itself returns an element.
 *
 * @param  {?(string|Function)} type     Tag name or element creator
 * @param  {Object}             props    Element properties, either attribute
 *                                       set to apply to DOM node or values to
 *                                       pass through to element creator
 * @param  {...wp.Element}      children Descendant elements
 * @return {wp.Element}                  Element
 */
export function createElement( type, props, ...children ) {
	return reactCreateElement( type, props, ...children );
}

/**
 * Renders a given element into the target DOM node.
 *
 * @param {wp.Element} element Element to render
 * @param {Element}    target  DOM node into which element should be rendered
 */
export function render( element, target ) {
	reactRender( element, target );
}
