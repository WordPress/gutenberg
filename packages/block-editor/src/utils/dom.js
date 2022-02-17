const BLOCK_SELECTOR = '.block-editor-block-list__block';
const APPENDER_SELECTOR = '.block-list-appender';

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
 * Returns true if an element is considered part of the block and not its inner
 * blocks or appender.
 *
 * @param {Element} blockElement Block container element.
 * @param {Element} element      Element.
 *
 * @return {boolean} Whether an element is considered part of the block and not
 *                   its inner blocks or appender.
 */
export function isInsideRootBlock( blockElement, element ) {
	const parentBlock = element.closest(
		[ BLOCK_SELECTOR, APPENDER_SELECTOR ].join( ',' )
	);
	return parentBlock === blockElement;
}

/**
 * Finds the block node given any DOM node inside the block.
 *
 * @param {Node?} node DOM node.
 *
 * @return {Element|null} Client ID or undefined if the node is not part of
 *                            a block.
 */
export function getBlockNode( node ) {
	while ( node && node.nodeType !== node.ELEMENT_NODE ) {
		node = node.parentNode;
	}

	if ( ! node ) {
		return null;
	}

	return /** @type {Element} */ ( node ).closest( BLOCK_SELECTOR );
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
	const blockNode = getBlockNode( node );

	if ( ! blockNode ) {
		return;
	}

	return blockNode.id.slice( 'block-'.length );
}
