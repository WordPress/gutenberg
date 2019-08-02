/**
 * External dependencies
 */
import { createElement as createReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { HTMLElement } from '@wordpress/components';

/**
 * Returns a new element of given type. Type can be either a string tag name or
 * another function which itself returns an element.
 *
 * @param {?(string|Function)} type     Tag name or element creator
 * @param {Object}             props    Element properties, either attribute
 *                                       set to apply to DOM node or values to
 *                                       pass through to element creator
 * @param {...WPElement}       children Descendant elements
 *
 * @return {WPElement} Element.
 */
function createElement( type, ...otherArguments ) {
	if ( HTMLElement.supportsType( type ) ) {
		return createReactElement( HTMLElement.withTagName( type ), ...otherArguments );
	}
	return createReactElement( ...arguments );
}

export default createElement;
