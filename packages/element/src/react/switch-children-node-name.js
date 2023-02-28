/**
 * Internal dependencies
 */
import { Children } from './core';
import { createElement } from './create-element';

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
