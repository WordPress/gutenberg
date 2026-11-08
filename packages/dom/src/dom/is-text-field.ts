import isHTMLInputElement from './is-html-input-element';

/**
 * Check whether the given element is a text field, where text field is defined
 * by the ability to select within the input, or that it is contenteditable.
 *
 * See: https://html.spec.whatwg.org/#textFieldSelection
 *
 * @param node The HTML element.
 * @return True if the element is an text field, false if not.
 */
export default function isTextField( node: Node ): node is HTMLElement {
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
		'email',
		'time',
	];
	return (
		( isHTMLInputElement( node ) &&
			node.type &&
			! nonTextInputs.includes( node.type ) ) ||
		node.nodeName === 'TEXTAREA' ||
		( node as HTMLElement ).contentEditable === 'true'
	);
}
