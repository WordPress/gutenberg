/**
 * External dependencies
 */
import { isString } from 'lodash';
import { createElement as createReactElement } from 'react';
import { Image, Text, View } from 'react-native';

const containerHTMLTags = [
    'div',
    'figure',
    'figcaption',
    'label',
    'li',
    'ol',
    'span',
    'ul',
];

const createHTMLElement = ( tagName, props, children ) => {
    const renderChild = ( child ) => {
        if ( ! isString( child ) || child === '' ) {
            return child;
        }
        return (
            <Text>{ child }</Text>
        );
    };

    return (
        <View
            { ...props }
            tagName={ tagName }
        >
            { children.map( renderChild ) }
        </View>
    );
};

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
function createElement( type, props, ...children ) {
    if ( ! isString( type ) ) {
        return createReactElement( type, props, ...children );
    } else if ( containerHTMLTags.includes( type ) ) {
        return createHTMLElement( type, props, children );
    } else if ( type === 'img' ) {
        const { src: uri, ...otherProps } = props;
        return createElement(
            Image,
            {
                ...otherProps,
                source: {
                    uri,
                }
            },
            ...children,
        )
    } else {
        return createReactElement( type, props, ...children );
    }
}

export default createElement;
