/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import isHTMLInputElement from './is-html-input-element';

/* eslint-disable jsdoc/valid-types */
/**
 * Check whether the given element is an input field of type number.
 *
 * @param {Node} node The HTML node.
 *
 * @return {node is HTMLInputElement} True if the node is number input.
 */
export default function isNumberInput( node ) {
	deprecated( 'wp.dom.isNumberInput', {
		since: '6.1',
		version: '6.5',
	} );
	/* eslint-enable jsdoc/valid-types */
	return (
		isHTMLInputElement( node ) &&
		node.type === 'number' &&
		! isNaN( node.valueAsNumber )
	);
}
