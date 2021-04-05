/**
 * Internal dependencies
 */
import isHTMLInputElement from './is-html-input-element';

/* eslint-disable jsdoc/valid-types */
/**
 * Check whether the given element is an input field of type number
 * and has a valueAsNumber
 *
 * @param {Node} node The HTML node.
 *
 * @return {node is HTMLInputElement} True if the node is input and holds a number.
 */
export default function isNumberInput( node ) {
	/* eslint-enable jsdoc/valid-types */
	return (
		isHTMLInputElement( node ) &&
		node.type === 'number' &&
		!! node.valueAsNumber
	);
}
