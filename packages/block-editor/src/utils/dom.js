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
 * Calculates the union of two rectangles.
 *
 * @param {DOMRect} rect1 First rectangle.
 * @param {DOMRect} rect2 Second rectangle.
 * @return {DOMRect} Union of the two rectangles.
 */
export function rectUnion( rect1, rect2 ) {
	const left = Math.min( rect1.left, rect2.left );
	const right = Math.max( rect1.right, rect2.right );
	const bottom = Math.max( rect1.bottom, rect2.bottom );
	const top = Math.min( rect1.top, rect2.top );

	return new window.DOMRectReadOnly( left, top, right - left, bottom - top );
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

	// Older browsers, e.g. Safari < 17.4 may not support the `checkVisibility` method.
	if ( element.checkVisibility ) {
		return element.checkVisibility?.( {
			opacityProperty: true,
			contentVisibilityAuto: true,
			visibilityProperty: true,
		} );
	}

	const style = viewport.getComputedStyle( element );

	if (
		style.display === 'none' ||
		style.visibility === 'hidden' ||
		style.opacity === '0'
	) {
		return false;
	}

	return true;
}

/**
 * Checks if the element is scrollable.
 *
 * @param {Element} element Element.
 * @return {boolean} True if the element is scrollable.
 */
function isScrollable( element ) {
	const style = window.getComputedStyle( element );
	return (
		style.overflowX === 'auto' ||
		style.overflowX === 'scroll' ||
		style.overflowY === 'auto' ||
		style.overflowY === 'scroll'
	);
}

export const WITH_OVERFLOW_ELEMENT_BLOCKS = [ 'core/navigation' ];
/**
 * Returns the bounding rectangle of an element, with special handling for blocks
 * that have visible overflowing children (defined in WITH_OVERFLOW_ELEMENT_BLOCKS).
 *
 * For blocks like Navigation that can have overflowing elements (e.g. submenus),
 * this function calculates the combined bounds of both the parent and its visible
 * children. The returned rect may extend beyond the viewport.
 * The returned rect represents the full extent of the element and its visible
 * children, which may extend beyond the viewport.
 *
 * @param {Element} element Element.
 * @return {DOMRect} Bounding client rect of the element and its visible children.
 */
export function getElementBounds( element ) {
	const viewport = element.ownerDocument.defaultView;

	if ( ! viewport ) {
		return new window.DOMRectReadOnly();
	}

	let bounds = element.getBoundingClientRect();
	const dataType = element.getAttribute( 'data-type' );

	/*
	 * For blocks with overflowing elements (like Navigation), include the bounds
	 * of visible children that extend beyond the parent container.
	 */
	if ( dataType && WITH_OVERFLOW_ELEMENT_BLOCKS.includes( dataType ) ) {
		const stack = [ element ];
		let currentElement;

		while ( ( currentElement = stack.pop() ) ) {
			// Children won’t affect bounds unless the element is not scrollable.
			if ( ! isScrollable( currentElement ) ) {
				for ( const child of currentElement.children ) {
					if ( isElementVisible( child ) ) {
						const childBounds = child.getBoundingClientRect();
						bounds = rectUnion( bounds, childBounds );
						stack.push( child );
					}
				}
			}
		}
	}

	/*
	 * Take into account the outer horizontal limits of the container in which
	 * an element is supposed to be "visible". For example, if an element is
	 * positioned -10px to the left of the window x value (0), this function
	 * discounts the negative overhang because it's not visible and therefore
	 * not to be counted in the visibility calculations. Top and bottom values
	 * are not accounted for to accommodate vertical scroll.
	 */
	const left = Math.max( bounds.left, 0 );
	const right = Math.min( bounds.right, viewport.innerWidth );
	bounds = new window.DOMRectReadOnly(
		left,
		bounds.top,
		right - left,
		bounds.height
	);

	return bounds;
}
