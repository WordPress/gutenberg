/**
 * Internal dependencies
 */
import isHTMLInputElement from './is-html-input-element';

/* eslint-disable jsdoc/valid-types */
/**
 * Check whether the given element is a text field, where text field is defined
 * by the ability to select within the input, or that it is contenteditable.
 *
 * See: https://html.spec.whatwg.org/#textFieldSelection
 *
 * @param {Node} node The HTML element.
 * @return {node is HTMLElement} True if the element is an text field, false if not.
 */
export default function isTextField( node ) {
	/* eslint-enable jsdoc/valid-types */
	const nonTextInputs = [
		'button',
		'checkbox',
		'hidden',
		'file',
		'radio',
		'image',
		'range',
		'reset',
		'submit',
		'number',
	];
	return (
		( isHTMLInputElement( node ) &&
			node.type &&
			! nonTextInputs.includes( node.type ) ) ||
		node.nodeName === 'TEXTAREA' ||
		/** @type {HTMLElement} */ ( node ).contentEditable === 'true'
	);
}
