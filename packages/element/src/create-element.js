/**
 * External dependencies
 */
import { createElement } from 'react';

/**
 * Returns a new element of given type. Type can be either a string tag name or
 * another function which itself returns an element.
 *
 * @param {?(string|Function)} type     Tag name or element creator.
 * @param {Object}             props    Element properties, either attribute
 *                                       set to apply to node or values to
 *                                       pass through to element creator.
 * @param {...WPElement}       children Descendant elements.
 *
 * @return {WPElement} Element.
 */
export default createElement;
