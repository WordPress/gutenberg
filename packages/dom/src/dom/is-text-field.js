/**
 * Check whether the given element is a text field, where text field is defined
 * by the ability to select within the input, or that it is contenteditable or
 * within a contenteditable container.
 *
 * See: https://html.spec.whatwg.org/#textFieldSelection
 *
 * @param {HTMLElement} element The HTML element.
 *
 * @return {boolean} True if the element is an text field, false if not.
 */
export default function isTextField( element ) {
	const { nodeName } = element;
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
		( nodeName === 'INPUT' && ! nonTextInputs.includes( element.type ) ) ||
		nodeName === 'TEXTAREA' ||
		!! element.closest( '[contenteditable]' )
	);
}
