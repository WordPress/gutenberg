/**
 * External dependencies
 */
import {
	createElement,
	Component,
} from 'react';
import {
	camelCase,
	flowRight,
	isString,
	upperFirst,
} from 'lodash';
/**
 * Internal dependencies
 */
import serialize from './serialize';
import { RawHTML } from './index-common';

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
export { createElement };

/**
 * A base class to create WordPress Components (Refs, state and lifecycle hooks)
 */
export { Component };

/**
 * Renders a given element into a string.
 *
 * @param {WPElement} element Element to render
 *
 * @return {string} HTML.
 */
export { serialize as renderToString };

/**
 * Component used as equivalent of Fragment with unescaped HTML, in cases where
 * it is desirable to render dangerous HTML without needing a wrapper element.
 * To preserve additional props, a `div` wrapper _will_ be created if any props
 * aside from `children` are passed.
 *
 * @param {string} props.children HTML to render.
 *
 * @return {WPElement} Dangerously-rendering element.
 */
export { RawHTML };

/**
 * Composes multiple higher-order components into a single higher-order component. Performs right-to-left function
 * composition, where each successive invocation is supplied the return value of the previous.
 *
 * @param {...Function} hocs The HOC functions to invoke.
 *
 * @return {Function} Returns the new composite function.
 */
export { flowRight as compose };

/**
 * Given a function mapping a component to an enhanced component and modifier
 * name, returns the enhanced component augmented with a generated displayName.
 *
 * @param {Function} mapComponentToEnhancedComponent Function mapping component
 *                                                   to enhanced component.
 * @param {string}   modifierName                    Seed name from which to
 *                                                   generated display name.
 *
 * @return {WPComponent} Component class with generated display name assigned.
 */
export function createHigherOrderComponent( mapComponentToEnhancedComponent, modifierName ) {
	return ( OriginalComponent ) => {
		const EnhancedComponent = mapComponentToEnhancedComponent( OriginalComponent );
		const { displayName = OriginalComponent.name || 'Component' } = OriginalComponent;
		EnhancedComponent.displayName = `${ upperFirst( camelCase( modifierName ) ) }(${ displayName })`;

		return EnhancedComponent;
	};
}
