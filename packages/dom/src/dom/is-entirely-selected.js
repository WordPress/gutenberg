/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Check whether the contents of the element have been entirely selected.
 * Returns true if there is no possibility of selection.
 *
 * @param {Element} element The element to check.
 *
 * @return {boolean} True if entirely selected, false if not.
 */
export default function isEntirelySelected( element ) {
	if ( includes( [ 'INPUT', 'TEXTAREA' ], element.nodeName ) ) {
		return (
			element.selectionStart === 0 &&
			element.value.length === element.selectionEnd
		);
	}

	if ( ! element.isContentEditable ) {
		return true;
	}

	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;
	const selection = defaultView.getSelection();
	const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;

	if ( ! range ) {
		return true;
	}

	const { startContainer, endContainer, startOffset, endOffset } = range;

	if (
		startContainer === element &&
		endContainer === element &&
		startOffset === 0 &&
		endOffset === element.childNodes.length
	) {
		return true;
	}

	const lastChild = element.lastChild;
	const lastChildContentLength =
		lastChild.nodeType === lastChild.TEXT_NODE
			? lastChild.data.length
			: lastChild.childNodes.length;

	return (
		startContainer === element.firstChild &&
		endContainer === element.lastChild &&
		startOffset === 0 &&
		endOffset === lastChildContentLength
	);
}
