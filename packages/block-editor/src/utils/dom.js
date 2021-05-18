// Consider the block appender to be a child block of its own, which also has
// this class.
const BLOCK_SELECTOR = '.wp-block';

/**
 * Returns true if two elements are contained within the same block.
 *
 * @param {Element} a First element.
 * @param {Element} b Second element.
 *
 * @return {boolean} Whether elements are in the same block.
 */
export function isInSameBlock( a, b ) {
	return a.closest( BLOCK_SELECTOR ) === b.closest( BLOCK_SELECTOR );
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
	const parentBlock = element.closest( BLOCK_SELECTOR );
	return parentBlock === blockElement;
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
	const blockNode = elementNode.closest( BLOCK_SELECTOR );

	if ( ! blockNode ) {
		return;
	}

	return blockNode.id.slice( 'block-'.length );
}
