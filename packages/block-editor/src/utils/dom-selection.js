/**
 * WordPress dependencies
 */
import { create } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { getBlockClientId } from './dom';

/**
 * Returns the rich text element containing the given node, if any.
 *
 * @param {Node} node Node to search from.
 *
 * @return {Element|undefined} The rich text element.
 */
export function getRichTextElement( node ) {
	const element =
		node.nodeType === node.ELEMENT_NODE ? node : node.parentElement;
	return element?.closest( '[data-wp-block-attribute-key]' );
}

/**
 * Builds a store selection payload for a collapsed native selection inside a
 * rich text element.
 *
 * @param {Selection} selection The native selection.
 *
 * @return {Object|undefined} A payload for the `selectionChange` action, or
 *                            undefined when the selection is not inside a
 *                            rich text element.
 */
export function getCollapsedSelectionPayload( selection ) {
	const richTextElement = getRichTextElement( selection.anchorNode );

	if ( ! richTextElement ) {
		return;
	}

	const clientId = getBlockClientId( richTextElement );

	if ( ! clientId ) {
		return;
	}

	const { start } = create( {
		element: richTextElement,
		range: selection.getRangeAt( 0 ),
		__unstableIsEditableTree: true,
	} );
	const attributeKey = richTextElement.dataset.wpBlockAttributeKey;
	const offset = start ?? 0;
	return {
		start: { clientId, attributeKey, offset },
		end: { clientId, attributeKey, offset },
	};
}
