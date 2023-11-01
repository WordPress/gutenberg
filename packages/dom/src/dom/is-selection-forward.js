/**
 * Internal dependencies
 */
import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Returns true if the given selection object is in the forward direction, or
 * false otherwise.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
 *
 * @param {Selection} selection Selection object to check.
 *
 * @return {boolean} Whether the selection is forward.
 */
export default function isSelectionForward( selection ) {
	const { anchorNode, focusNode, anchorOffset, focusOffset } = selection;

	assertIsDefined( anchorNode, 'anchorNode' );
	assertIsDefined( focusNode, 'focusNode' );
	const position = anchorNode.compareDocumentPosition( focusNode );

	// Disable reason: `Node#compareDocumentPosition` returns a bitmask value,
	// so bitwise operators are intended.
	/* eslint-disable no-bitwise */
	// Compare whether anchor node precedes focus node. If focus node (where
	// end of selection occurs) is after the anchor node, it is forward.
	if ( position & anchorNode.DOCUMENT_POSITION_PRECEDING ) {
		return false;
	}

	if ( position & anchorNode.DOCUMENT_POSITION_FOLLOWING ) {
		return true;
	}
	/* eslint-enable no-bitwise */

	// `compareDocumentPosition` returns 0 when passed the same node, in which
	// case compare offsets.
	if ( position === 0 ) {
		return anchorOffset <= focusOffset;
	}

	// This should never be reached, but return true as default case.
	return true;
}
