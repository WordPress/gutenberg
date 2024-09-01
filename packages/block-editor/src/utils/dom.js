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
 * Calculates the union of two rectangles, and optionally constrains this union within a containerRect's
 * left and right values.
 * The function returns a new DOMRect object representing this union.
 *
 * @param {DOMRect}          rect1         First rectangle.
 * @param {DOMRect}          rect2         Second rectangle.
 * @param {DOMRectReadOnly?} containerRect An optional container rectangle. The union will be clipped to this rectangle.
 * @return {DOMRect} Union of the two rectangles.
 */
export function rectUnion( rect1, rect2, containerRect ) {
	let left = Math.min( rect1.left, rect2.left );
	let right = Math.max( rect1.right, rect2.right );
	const bottom = Math.max( rect1.bottom, rect2.bottom );
	const top = Math.min( rect1.top, rect2.top );

	/*
	 * To calculate visible bounds using rectUnion, take into account the outer
	 * horizontal limits of the container in which an element is supposed to be "visible".
	 * For example, if an element is positioned -10px to the left of the window x value (0),
	 * this function discounts the negative overhang because it's not visible and
	 * therefore not to be counted in the visibility calculations.
	 * Top and bottom values are not accounted for to accommodate vertical scroll.
	 */
	if ( containerRect ) {
		left = Math.max( left, containerRect.left );
		right = Math.min( right, containerRect.right );
	}

	return new window.DOMRect( left, top, right - left, bottom - top );
}

/**
 * Returns whether an element is visible.
 *
 * @param {Element} element Element.
 * @return {boolean} Whether the element is visible.
 */
function isElementVisible( element ) {
	const viewport = element.ownerDocument.defaultView;
	if ( ! viewport ) {
		return false;
	}

	// Check for <VisuallyHidden> component.
	if ( element.classList.contains( 'components-visually-hidden' ) ) {
		return false;
	}

	const bounds = element.getBoundingClientRect();
	if ( bounds.width === 0 || bounds.height === 0 ) {
		return false;
	}

	return element.checkVisibility( {
		opacityProperty: true,
		contentVisibilityAuto: true,
		visibilityProperty: true,
	} );
}

/**
 * Returns the rect of the element including all visible nested elements.
 *
 * Visible nested elements, including elements that overflow the parent, are
 * taken into account.
 *
 * This function is useful for calculating the visible area of a block that
 * contains nested elements that overflow the block, e.g. the Navigation block,
 * which can contain overflowing Submenu blocks.
 *
 * The returned rect represents the full extent of the element and its visible
 * children, which may extend beyond the viewport.
 *
 * @param {Element} element Element.
 * @return {DOMRect} Bounding client rect of the element and its visible children.
 */
export function getVisibleElementBounds( element ) {
	const viewport = element.ownerDocument.defaultView;
	if ( ! viewport ) {
		return new window.DOMRect();
	}

	let bounds = element.getBoundingClientRect();
	const viewportRect = new window.DOMRectReadOnly(
		0,
		0,
		viewport.innerWidth,
		viewport.innerHeight
	);

	const stack = [ element ];
	let currentElement;

	while ( ( currentElement = stack.pop() ) ) {
		for ( const child of currentElement.children ) {
			if ( isElementVisible( child ) ) {
				const childBounds = child.getBoundingClientRect();
				bounds = rectUnion( bounds, childBounds, viewportRect );
				stack.push( child );
			}
		}
	}

	return bounds;
}
