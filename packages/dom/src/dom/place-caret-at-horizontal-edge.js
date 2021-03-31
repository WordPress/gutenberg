/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Places the caret at start or end of a given element.
 *
 * @param {Element} container Focusable element.
 * @param {boolean} isReverse True for end, false for start.
 */
export default function placeCaretAtHorizontalEdge( container, isReverse ) {
	if ( ! container ) {
		return;
	}

	container.focus();

	if ( includes( [ 'INPUT', 'TEXTAREA' ], container.tagName ) ) {
		// The element may not support selection setting.
		if ( typeof container.selectionStart !== 'number' ) {
			return;
		}

		if ( isReverse ) {
			container.selectionStart = container.value.length;
			container.selectionEnd = container.value.length;
		} else {
			container.selectionStart = 0;
			container.selectionEnd = 0;
		}

		return;
	}

	if ( ! container.isContentEditable ) {
		return;
	}

	// Select on extent child of the container, not the container itself. This
	// avoids the selection always being `endOffset` of 1 when placed at end,
	// where `startContainer`, `endContainer` would always be container itself.
	const rangeTarget = container[ isReverse ? 'lastChild' : 'firstChild' ];

	// If no range target, it implies that the container is empty. Focusing is
	// sufficient for caret to be placed correctly.
	if ( ! rangeTarget ) {
		return;
	}

	const { ownerDocument } = container;
	const { defaultView } = ownerDocument;
	const selection = defaultView.getSelection();
	const range = ownerDocument.createRange();

	range.selectNodeContents( rangeTarget );
	range.collapse( ! isReverse );

	selection.removeAllRanges();
	selection.addRange( range );
}
