/**
 * Internal dependencies
 */
import isHTMLInputElement from './is-html-input-element';

/**
 * Check whether the given element is a text field, where text field is defined
 * by the ability to select within the input, or that it is contenteditable.
 *
 * See: https://html.spec.whatwg.org/#textFieldSelection
 *
 * @param {Element} element The HTML element.
 *
 * @return {boolean} True if the element is an text field, false if not.
 */
export default function isTextField( element ) {
	const {
		nodeName,
		contentEditable,
	} = /** @type { HTMLElement } */ ( element );
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
		( isHTMLInputElement( element ) &&
			element.type &&
			! nonTextInputs.includes( element.type ) ) ||
		nodeName === 'TEXTAREA' ||
		contentEditable === 'true'
	);
}
