/**
 * External dependencies
 */
import { get, isString, lowerFirst, reduce } from 'lodash';
import { createElement as createElementDefault } from 'react';
import * as SVGComponents from 'react-native-svg';

const htmlTagToNativeComponent = {
	...reduce( SVGComponents, ( result, component, componentName ) => {
		result[ lowerFirst( componentName ) ] = component;
		return result;
	}, {} ),
};

const mapHTMLTagToNativeComponent = ( type ) => {
	if ( ! isString( type ) ) {
		return type;
	}

	return get( htmlTagToNativeComponent, [ type ], type );
};

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
const createElement = ( type, props, ...children ) => {
	return createElementDefault(
		mapHTMLTagToNativeComponent( type ),
		props,
		...children
	);
};

export default createElement;
