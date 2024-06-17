const BLOCK_SELECTOR = '.block-editor-block-list__block';
const APPENDER_SELECTOR = '.block-list-appender';
const BLOCK_APPENDER_CLASS = '.block-editor-button-block-appender';

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
		[ BLOCK_SELECTOR, APPENDER_SELECTOR, BLOCK_APPENDER_CLASS ].join( ',' )
	);
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

/**
 * Returns the union of two DOMRect objects.
 *
 * @param {DOMRect} rect1 First rectangle.
 * @param {DOMRect} rect2 Second rectangle.
 * @return {DOMRect} Union of the two rectangles.
 */
export function rectUnion( rect1, rect2 ) {
	const left = Math.min( rect1.left, rect2.left );
	const top = Math.min( rect1.top, rect2.top );
	const right = Math.max( rect1.right, rect2.right );
	const bottom = Math.max( rect1.bottom, rect2.bottom );
	return new window.DOMRect( left, top, right - left, bottom - top );
}

/**
 * Returns the intersection of two DOMRect objects.
 *
 * @param {DOMRect} rect1 First rectangle.
 * @param {DOMRect} rect2 Second rectangle.
 * @return {DOMRect} Intersection of the two rectangles.
 */
function rectIntersect( rect1, rect2 ) {
	const left = Math.max( rect1.left, rect2.left );
	const top = Math.max( rect1.top, rect2.top );
	const right = Math.min( rect1.right, rect2.right );
	const bottom = Math.min( rect1.bottom, rect2.bottom );
	return new window.DOMRect( left, top, right - left, bottom - top );
}

/**
 * Returns whether an element is visible.
 *
 * @param {Element} element Element.
 * @return {boolean} Whether the element is visible.
 */
function isElementVisible( element ) {
	const style = window.getComputedStyle( element );
	if (
		style.display === 'none' ||
		style.visibility === 'hidden' ||
		style.opacity === '0'
	) {
		return false;
	}

	const bounds = element.getBoundingClientRect();
	return (
		bounds.width > 0 &&
		bounds.height > 0 &&
		bounds.right >= 0 &&
		bounds.bottom >= 0 &&
		bounds.left <= window.innerWidth &&
		bounds.top <= window.innerHeight
	);
}

/**
 * Returns the rect of the element that is visible in the viewport.
 *
 * Visible nested elements, including elements that overflow the parent, are
 * taken into account. The returned rect is clipped to the viewport.
 *
 * This function is useful for calculating the visible area of a block that
 * contains nested elements that overflow the block, e.g. the Navigation block,
 * which can contain overflowing Submenu blocks.
 *
 * The returned rect is suitable for passing to the Popover component to
 * position the popover relative to the visible area of the block.
 *
 * @param {Element} element Element.
 * @return {DOMRect} Bounding client rect.
 */
export function getVisibleBoundingRect( element ) {
	let bounds = element.getBoundingClientRect();

	const stack = [ element ];
	let currentElement;

	while ( ( currentElement = stack.pop() ) ) {
		for ( const child of currentElement.children ) {
			if ( isElementVisible( child ) ) {
				const childBounds = child.getBoundingClientRect();
				bounds = rectUnion( bounds, childBounds );
				stack.push( child );
			}
		}
	}

	const viewportRect = new window.DOMRect(
		0,
		0,
		window.innerWidth,
		window.innerHeight
	);
	return rectIntersect( bounds, viewportRect );
}
