/**
 * Given a block client ID, returns the corresponding DOM node for the block,
 * if exists. As much as possible, this helper should be avoided, and used only
 * in cases where isolated behaviors need remote access to a block node.
 *
 * @param {string}   clientId Block client ID.
 * @param {Document} doc      Document to search.
 *
 * @return {Element?} Block DOM node.
 */
export function getBlockDOMNode( clientId, doc ) {
	return doc.getElementById( 'block-' + clientId );
}

/**
 * Returns the preview container DOM node for a given block client ID, or
 * undefined if the container cannot be determined.
 *
 * @param {string}   clientId Block client ID.
 * @param {Document} doc      Document to search.
 *
 * @return {Node|undefined} Preview container DOM node.
 */
export function getBlockPreviewContainerDOMNode( clientId, doc ) {
	const domNode = getBlockDOMNode( clientId, doc );

	if ( ! domNode ) {
		return;
	}

	return domNode.firstChild || domNode;
}

/**
 * Returns true if the given element is a block focus stop. Blocks without their
 * own text fields rely on the focus stop to be keyboard navigable.
 *
 * @param {Element} element Element to test.
 *
 * @return {boolean} Whether element is a block focus stop.
 */
export function isBlockFocusStop( element ) {
	return element.classList.contains( 'block-editor-block-list__block' );
}

/**
 * Returns true if two elements are contained within the same block.
 *
 * @param {Element} a First element.
 * @param {Element} b Second element.
 *
 * @return {boolean} Whether elements are in the same block.
 */
export function isInSameBlock( a, b ) {
	return (
		a.closest( '.block-editor-block-list__block' ) ===
		b.closest( '.block-editor-block-list__block' )
	);
}

/**
 * Returns true if an element is considered part of the block and not its
 * children.
 *
 * @param {Element} blockElement Block container element.
 * @param {Element} element      Element.
 *
 * @return {boolean} Whether element is in the block Element but not its
 *                   children.
 */
export function isInsideRootBlock( blockElement, element ) {
	const parentBlock = element.closest( '.block-editor-block-list__block' );
	return parentBlock === blockElement;
}

/**
 * Returns true if the given element contains inner blocks (an InnerBlocks
 * element).
 *
 * @param {Element} element Element to test.
 *
 * @return {boolean} Whether element contains inner blocks.
 */
export function hasInnerBlocksContext( element ) {
	return (
		element.classList.contains( 'block-editor-block-list__layout' ) ||
		!! element.querySelector( '.block-editor-block-list__layout' )
	);
}

/**
 * Finds the block client ID given any DOM node inside the block.
 *
 * @param {Node?} node DOM node.
 *
 * @return {string|undefined} Client ID or undefined if the node is not part of
 *                            a block.
 */
export function getBlockClientId( node ) {
	while ( node && node.nodeType !== node.ELEMENT_NODE ) {
		node = node.parentNode;
	}

	if ( ! node ) {
		return;
	}

	const elementNode = /** @type {Element} */ ( node );
	const blockNode = elementNode.closest( '.block-editor-block-list__block' );

	if ( ! blockNode ) {
		return;
	}

	return blockNode.id.slice( 'block-'.length );
}
