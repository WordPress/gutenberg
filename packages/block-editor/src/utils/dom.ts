import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { unlock } from '../lock-unlock';

const { getStyleTransform } = unlock( componentsPrivateApis );

const BLOCK_SELECTOR = '.block-editor-block-list__block';
const APPENDER_SELECTOR = '.block-list-appender';
const BLOCK_APPENDER_CLASS = '.block-editor-button-block-appender';

/**
 * Returns true if two elements are contained within the same block.
 *
 * @param a First element.
 * @param b Second element.
 *
 * @return Whether elements are in the same block.
 */
export function isInSameBlock( a: Element, b: Element ) {
	return a.closest( BLOCK_SELECTOR ) === b.closest( BLOCK_SELECTOR );
}

/**
 * Returns true if an element is considered part of the block and not its inner
 * blocks or appender.
 *
 * @param blockElement Block container element.
 * @param element      Element.
 *
 * @return Whether an element is considered part of the block and not
 *         its inner blocks or appender.
 */
export function isInsideRootBlock( blockElement: Element, element: Element ) {
	const parentBlock = element.closest(
		[ BLOCK_SELECTOR, APPENDER_SELECTOR, BLOCK_APPENDER_CLASS ].join( ',' )
	);
	return parentBlock === blockElement;
}

/**
 * Returns the editable element containing the selection, if the selection is
 * fully contained within one. The root element (an editable wrapper) does not
 * count as a containing editable element.
 *
 * @param selection The selection.
 * @param root      The editable wrapper element.
 *
 * @return The editable element containing the selection.
 */
export function getSelectionEditableElement(
	selection: Selection,
	root: Element
) {
	const { anchorNode, focusNode } = selection;

	if ( ! anchorNode || ! focusNode ) {
		return;
	}

	const element =
		anchorNode.nodeType === anchorNode.ELEMENT_NODE
			? ( anchorNode as Element )
			: anchorNode.parentElement;
	const editable = element?.closest( '[contenteditable="true"]' );

	if ( ! editable || editable === root || ! editable.contains( focusNode ) ) {
		return;
	}

	return editable;
}

/**
 * Finds the block client ID given any DOM node inside the block.
 *
 * @param node DOM node.
 *
 * @return Client ID or undefined if the node is not part of
 *         a block.
 */
export function getBlockClientId( node: Node | null ) {
	while ( node && node.nodeType !== node.ELEMENT_NODE ) {
		node = node.parentNode;
	}

	if ( ! node ) {
		return;
	}

	const elementNode = node as Element;
	const blockNode = elementNode.closest( BLOCK_SELECTOR );

	if ( ! blockNode ) {
		return;
	}

	return blockNode.id.slice( 'block-'.length );
}

/**
 * Returns whether a computed style rotates or skews an element, so that its
 * edges are no longer parallel to the viewport. Translating and scaling keep
 * them parallel, so they don't count.
 *
 * @param style The computed style of the element.
 * @return Whether the element is rotated or skewed.
 */
export function isStyleRotated(
	style: Pick< CSSStyleDeclaration, 'rotate' | 'scale' | 'transform' >
) {
	const { a, b, c, d } = getStyleTransform( style );
	const isAxisAligned =
		( Math.abs( b ) < 1e-5 && Math.abs( c ) < 1e-5 ) ||
		( Math.abs( a ) < 1e-5 && Math.abs( d ) < 1e-5 );
	return ! isAxisAligned;
}

/**
 * Returns the outermost block element containing the given element that is
 * rotated or skewed, if any.
 *
 * @param element Element.
 * @return The outermost rotated ancestor block element.
 */
export function getOutermostRotatedAncestorBlock( element: Element ) {
	const view = element.ownerDocument.defaultView;
	if ( ! view ) {
		return;
	}

	let rotatedAncestor: Element | undefined;
	let ancestor = element.parentElement?.closest( BLOCK_SELECTOR );
	while ( ancestor ) {
		if ( isStyleRotated( view.getComputedStyle( ancestor ) ) ) {
			rotatedAncestor = ancestor;
		}
		ancestor = ancestor.parentElement?.closest( BLOCK_SELECTOR );
	}

	return rotatedAncestor;
}

/**
 * Whether an element is a block's own element outside its fields, such as a
 * list item's bullet. Fields keep their own `contentEditable`.
 *
 * @param element Element.
 *
 * @return Whether the element is a block's own element outside its fields.
 */
export function isBlockElementOutsideFields( element: Element | null ) {
	return (
		( element as HTMLElement | null )?.contentEditable === 'inherit' &&
		element!.hasAttribute( 'data-block' )
	);
}

/**
 * Calculates the union of two rectangles.
 *
 * @param rect1 First rectangle.
 * @param rect2 Second rectangle.
 * @return Union of the two rectangles.
 */
export function rectUnion( rect1: DOMRect, rect2: DOMRect ) {
	const left = Math.min( rect1.left, rect2.left );
	const right = Math.max( rect1.right, rect2.right );
	const bottom = Math.max( rect1.bottom, rect2.bottom );
	const top = Math.min( rect1.top, rect2.top );

	return new window.DOMRectReadOnly( left, top, right - left, bottom - top );
}

const ANGLE_UNITS: Record< string, number > = {
	deg: 1,
	grad: 0.9,
	rad: 180 / Math.PI,
	turn: 360,
};

const ROTATE_AXES: Record< string, [ number, number, number ] > = {
	'': [ 0, 0, 1 ],
	x: [ 1, 0, 0 ],
	y: [ 0, 1, 0 ],
	z: [ 0, 0, 1 ],
};

function parseAngle( value: string ) {
	const match = value.match(
		/^(-?[\d.]+(?:e[+-]?\d+)?)(deg|grad|rad|turn)$/
	);
	return match ? parseFloat( match[ 1 ] ) * ANGLE_UNITS[ match[ 2 ] ] : NaN;
}

function parseLength( value: string, size: number ) {
	if ( value.endsWith( '%' ) ) {
		return ( parseFloat( value ) / 100 ) * size;
	}
	return value.endsWith( 'px' ) ? parseFloat( value ) : NaN;
}

/**
 * Builds the matrix an element's own `translate`, `rotate`, `scale` and
 * `transform` apply to its border box, about its transform origin.
 *
 * @param element Element.
 * @param style   Computed style of the element.
 *
 * @return The matrix, or undefined when the element is not transformed or
 *         a value can't be read.
 */
function getOwnTransform( element: HTMLElement, style: CSSStyleDeclaration ) {
	const {
		translate = 'none',
		rotate = 'none',
		scale = 'none',
		transform = 'none',
	} = style;

	if (
		translate === 'none' &&
		rotate === 'none' &&
		scale === 'none' &&
		transform === 'none'
	) {
		return;
	}

	const { offsetWidth: width, offsetHeight: height } = element;
	const [ originX, originY ] = style.transformOrigin
		.split( ' ' )
		.map( ( value ) => parseFloat( value ) );
	// CSS applies `translate`, then `rotate`, then `scale`, then `transform`.
	const matrix = new window.DOMMatrix().translateSelf( originX, originY );

	if ( translate !== 'none' ) {
		const [ x, y = '0px' ] = translate.split( ' ' );
		matrix.translateSelf(
			parseLength( x, width ),
			parseLength( y, height )
		);
	}

	if ( rotate !== 'none' ) {
		const parts = rotate.split( ' ' );
		const angle = parseAngle( parts.pop()! );
		const [ x, y, z ] =
			ROTATE_AXES[ parts.join( ' ' ) ] ??
			parts.map( ( value ) => parseFloat( value ) );
		matrix.rotateAxisAngleSelf( x, y, z, angle );
	}

	if ( scale !== 'none' ) {
		const [ x, y = x ] = scale
			.split( ' ' )
			.map( ( value ) =>
				value.endsWith( '%' )
					? parseFloat( value ) / 100
					: parseFloat( value )
			);
		matrix.scaleSelf( x, y );
	}

	if ( transform !== 'none' ) {
		matrix.multiplySelf( new window.DOMMatrix( transform ) );
	}

	matrix.translateSelf( -originX, -originY );

	// The page is painted flat, so only the 2D part reaches the screen.
	const { a, b, c, d, e, f } = matrix;
	return [ a, b, c, d, e, f ].every( Number.isFinite )
		? new window.DOMMatrix( [ a, b, c, d, e, f ] )
		: undefined;
}

function getElementTransform( element: Element ) {
	const view = element.ownerDocument.defaultView;

	if ( ! view || ! ( 'offsetWidth' in element ) ) {
		return;
	}

	return getOwnTransform(
		element as HTMLElement,
		view.getComputedStyle( element )
	);
}

/**
 * Returns the matrix that maps the untransformed layout of the nearest
 * transformed element, from `element` up, to client coordinates. Blocks
 * inside that element keep their layout in this space, however it is
 * moved, turned or resized on screen.
 *
 * @param element Element to start from, usually a block's parent.
 * @return The matrix, or the identity matrix when nothing is transformed.
 */
export function getLayoutFrame( element: Element | null ): DOMMatrix {
	for ( let current = element; current; current = current.parentElement ) {
		const transform = getElementTransform( current );

		if ( ! transform ) {
			continue;
		}

		const frame = getLayoutFrame( current.parentElement );
		const { left, top } = getLayoutRect( current, frame );
		const matrix = frame.translate( left, top ).multiply( transform );

		return matrix.a * matrix.d - matrix.b * matrix.c
			? matrix
			: new window.DOMMatrix();
	}

	return new window.DOMMatrix();
}

/**
 * Returns the rectangle an element takes up in the layout, before any
 * transform moves, turns or resizes it or its ancestors. Transforms only
 * change how an element is painted, so this is where neighbouring blocks
 * and a newly inserted block line up. An untransformed element outside
 * transformed ancestors gets its bounding client rect.
 *
 * @param element Element.
 * @param frame   Layout frame of the element's parent, see `getLayoutFrame`.
 * @return The element's untransformed rect in the frame's coordinates.
 */
export function getLayoutRect(
	element: Element,
	frame = getLayoutFrame( element.parentElement )
) {
	const rect = element.getBoundingClientRect();
	const transform = getElementTransform( element );

	if ( ! transform && frame.isIdentity ) {
		return rect;
	}

	const { offsetWidth: width, offsetHeight: height } = element as HTMLElement;
	// An affine map takes a box's centre to the centre of its bounding rect.
	const center = frame.inverse().transformPoint( {
		x: rect.left + rect.width / 2,
		y: rect.top + rect.height / 2,
	} );
	const painted = ( transform ?? new window.DOMMatrix() ).transformPoint( {
		x: width / 2,
		y: height / 2,
	} );

	return new window.DOMRect(
		center.x - painted.x,
		center.y - painted.y,
		width,
		height
	);
}

/**
 * Maps a point in client coordinates into a layout frame.
 *
 * @param frame Layout frame, see `getLayoutFrame`.
 * @param x     Client x coordinate.
 * @param y     Client y coordinate.
 * @return The point in the frame's coordinates.
 */
export function toLayoutPoint( frame: DOMMatrix, x: number, y: number ) {
	return frame.isIdentity
		? new window.DOMPoint( x, y )
		: frame.inverse().transformPoint( { x, y } );
}

/**
 * Maps a rect in a layout frame to client coordinates. The result stays
 * level: it is centred on the rect's place on screen and scaled with the
 * frame, but never turned.
 *
 * @param frame Layout frame, see `getLayoutFrame`.
 * @param rect  Rect in the frame's coordinates.
 * @return The rect in client coordinates.
 */
export function toClientRect( frame: DOMMatrix, rect: DOMRect ) {
	if ( frame.isIdentity ) {
		return rect;
	}

	const center = frame.transformPoint( {
		x: rect.left + rect.width / 2,
		y: rect.top + rect.height / 2,
	} );
	const width = rect.width * Math.hypot( frame.a, frame.b );
	const height = rect.height * Math.hypot( frame.c, frame.d );

	return new window.DOMRect(
		center.x - width / 2,
		center.y - height / 2,
		width,
		height
	);
}

/**
 * Extends a rectangle upwards to a given top, keeping its horizontal extent.
 *
 * @param rect Rectangle.
 * @param top  The top to extend to.
 * @return The extended rectangle, or the original one if it is already higher.
 */
export function extendRectToTop( rect: DOMRect, top: number ) {
	if ( top >= rect.top ) {
		return rect;
	}

	return new window.DOMRectReadOnly(
		rect.left,
		top,
		rect.width,
		rect.bottom - top
	);
}

/**
 * Returns the top and bottom of an element's painted box within a column of
 * the screen, after every transform.
 *
 * @param element Element.
 * @param frame   Layout frame of the element's parent, see `getLayoutFrame`.
 * @param left    Left edge of the column, in client coordinates.
 * @param right   Right edge of the column, in client coordinates.
 * @return The span, or undefined when the box is outside the column.
 */
function getPaintedSpan(
	element: Element,
	frame: DOMMatrix,
	left: number,
	right: number
) {
	const { x, y, width, height } = getLayoutRect( element, frame );
	const matrix = frame
		.translate( x, y )
		.multiply( getElementTransform( element ) ?? new window.DOMMatrix() );
	const corners = [
		[ 0, 0 ],
		[ width, 0 ],
		[ width, height ],
		[ 0, height ],
	].map( ( [ cornerX, cornerY ] ) =>
		matrix.transformPoint( { x: cornerX, y: cornerY } )
	);
	const ys: number[] = [];

	corners.forEach( ( start, index ) => {
		const end = corners[ ( index + 1 ) % corners.length ];

		if ( start.x >= left && start.x <= right ) {
			ys.push( start.y );
		}

		// Where an edge crosses a side of the column.
		for ( const edge of [ left, right ] ) {
			if ( ( start.x - edge ) * ( end.x - edge ) < 0 ) {
				ys.push(
					start.y +
						( ( edge - start.x ) / ( end.x - start.x ) ) *
							( end.y - start.y )
				);
			}
		}
	} );

	return ys.length
		? { top: Math.min( ...ys ), bottom: Math.max( ...ys ) }
		: undefined;
}

/**
 * Returns the space between two stacked blocks as painted on screen, across
 * the width of an insertion line. A transform can move a block's painting
 * away from its layout box, so this keeps a level line clear of both blocks.
 *
 * @param previous Element of the block above.
 * @param next     Element of the block below.
 * @param frame    Layout frame of their parent, see `getLayoutFrame`.
 * @param line     The line's rect in client coordinates.
 * @return The visible gap, or undefined when the painted blocks overlap.
 */
export function getVisibleGap(
	previous: Element,
	next: Element,
	frame: DOMMatrix,
	line: DOMRect
) {
	const above = getPaintedSpan( previous, frame, line.left, line.right );
	const below = getPaintedSpan( next, frame, line.left, line.right );

	if ( ! above || ! below || below.top <= above.bottom ) {
		return;
	}

	return new window.DOMRect(
		line.left,
		above.bottom,
		line.width,
		below.top - above.bottom
	);
}

/**
 * Returns whether an element is visible.
 *
 * @param element Element.
 * @return Whether the element is visible.
 */
export function isElementVisible( element: Element ) {
	const viewport = element.ownerDocument.defaultView;
	if ( ! viewport ) {
		return false;
	}

	// Check for <VisuallyHidden> components.
	if ( element.hasAttribute( 'data-visually-hidden' ) ) {
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
 * @param element Element.
 * @return True if the element is scrollable.
 */
function isScrollable( element: Element ) {
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
 * @param element Element.
 * @return Bounding client rect of the element and its visible children.
 */
export function getElementBounds( element: Element ) {
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
