/**
 * Check whether the given element is a text field, where text field is defined
 * by the ability to select within the input, or that it is contenteditable.
 *
 * See: https://html.spec.whatwg.org/#textFieldSelection
 *
 * @param {Partial<HTMLInputElement>} element The HTML element.
 *
 * @return {boolean} True if the element is an text field, false if not.
 */
export default function isTextField( element ) {
	const { nodeName, contentEditable } = element;
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
		( nodeName === 'INPUT' &&
			element.type &&
			! nonTextInputs.includes( element.type ) ) ||
		nodeName === 'TEXTAREA' ||
		contentEditable === 'true'
	);
}
