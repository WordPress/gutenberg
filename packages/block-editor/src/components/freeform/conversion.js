import { DESIGN_WIDTH } from './constants';

/*
 * Converting a section this way is pixel-faithful: every block lands on the
 * screen position it already had, verified in the editor.
 *
 * It only works because the canvas owns its own stylesheet (see
 * `override-css.js`). Driving it through block attributes alone does not: the
 * editor does not re-render a block whose layout changes while one of its
 * children is selected, nor the unselected siblings whose coordinates were
 * written in the same breath, so the section renders its old layout and the
 * siblings collapse. That reproduces with no freeform code involved — select a
 * child of a Group, change the Group's layout attribute, and watch nothing
 * happen — and is worth fixing upstream.
 */

/**
 * Turns a section's current, rendered layout into canvas coordinates.
 *
 * A block in normal flow cannot simply be given `position: absolute` — every
 * block in the section would collapse onto the same spot. So the section is
 * measured first and those measurements become the coordinates: at the instant
 * of conversion the page looks exactly as it did, and from then on every block
 * in it can be moved.
 *
 * The canvas keeps the height the section already had, so nothing below it
 * shifts either.
 *
 * @param {Object}   options
 * @param {Object}   options.paddingBox The section's padding box, in viewport
 *                                      pixels. Children are positioned against
 *                                      this box, so it is the origin.
 * @param {Object[]} options.children   Each child's box, in viewport pixels.
 * @return {?{canvasHeight: number, rects: Object[]}} The canvas height and a
 *         rect per child, in design units, or null for a section that has not
 *         been laid out yet.
 */
export function getCanvasConversion( { paddingBox, children } ) {
	if ( ! paddingBox?.width ) {
		return null;
	}

	const scale = paddingBox.width / DESIGN_WIDTH;
	const toDesign = ( value ) => Math.round( value / scale );

	return {
		canvasHeight: toDesign( paddingBox.height ),
		rects: children.map( ( child ) => ( {
			x: toDesign( child.left - paddingBox.left ),
			y: toDesign( child.top - paddingBox.top ),
			width: toDesign( child.width ),
			height: toDesign( child.height ),
		} ) ),
	};
}

/**
 * The part of a block you can actually see.
 *
 * A block's layout box is not the thing on the page. In a constrained section
 * every block is the full content width, so an image, a button and a short line
 * of text all measure the whole canvas — and a block as wide as the canvas has
 * nowhere sideways to go, so everything ends up stacked against the left edge
 * however it is dragged. Measuring what is inside gives the canvas something
 * the size of what you are looking at.
 *
 * The block's own box is the limit. A child can reach outside it — a negative
 * margin, a shadow — and the canvas places the block, not the overflow.
 *
 * @param {Object}   blockBox     The block's own box, in viewport pixels.
 * @param {Object[]} contentBoxes The boxes of what is inside it.
 * @return {Object} The box to place, in viewport pixels.
 */
export function getVisibleBox( blockBox, contentBoxes ) {
	const boxes = contentBoxes.filter(
		( box ) => box.width > 0 && box.height > 0
	);
	if ( ! boxes.length ) {
		return blockBox;
	}

	const right = blockBox.left + blockBox.width;
	const bottom = blockBox.top + blockBox.height;
	const left = Math.max(
		blockBox.left,
		Math.min( ...boxes.map( ( box ) => box.left ) )
	);
	const top = Math.max(
		blockBox.top,
		Math.min( ...boxes.map( ( box ) => box.top ) )
	);

	return {
		left,
		top,
		width: Math.max(
			0,
			Math.min(
				right,
				Math.max( ...boxes.map( ( box ) => box.left + box.width ) )
			) - left
		),
		height: Math.max(
			0,
			Math.min(
				bottom,
				Math.max( ...boxes.map( ( box ) => box.top + box.height ) )
			) - top
		),
	};
}

/**
 * Measures a section in the editor, ready for `getCanvasConversion`.
 *
 * Children are measured against the padding box rather than the border box,
 * because that is what an absolutely positioned child is placed against.
 *
 * The blocks to measure are named rather than taken from the element's own
 * children, because they are not always its children yet: a block sitting in a
 * column is about to become one, and the position worth keeping is the one it
 * has right now, while the column is still laying it out. Measure first, move
 * afterwards — the other way round, the column has already reflowed and the
 * position is gone.
 *
 * A block with no styling of its own is measured by what is inside it rather
 * than by its own box; see `getVisibleBox` for why. One that has a background
 * or padding is measured whole, because that box is the thing you can see.
 *
 * @param {Element}  element           The section's element, inside the editor
 *                                     canvas.
 * @param {string[]} clientIds         The blocks to measure, in the order they
 *                                     should end up in, at any depth inside
 *                                     the section.
 * @param {Function} measureByContents Whether a block should be measured by
 *                                     what is inside it.
 * @return {?{paddingBox: Object, children: Object[], clientIds: string[]}} The
 *         measurements, or null when none of them are rendered.
 */
export function measureSection(
	element,
	clientIds,
	measureByContents = () => false
) {
	const view = element.ownerDocument.defaultView;
	const style = view.getComputedStyle( element );
	const box = element.getBoundingClientRect();
	const borderLeft = parseFloat( style.borderLeftWidth ) || 0;
	const borderTop = parseFloat( style.borderTopWidth ) || 0;
	const borderRight = parseFloat( style.borderRightWidth ) || 0;
	const borderBottom = parseFloat( style.borderBottomWidth ) || 0;

	const paddingBox = {
		left: box.left + borderLeft,
		top: box.top + borderTop,
		width: box.width - borderLeft - borderRight,
		height: box.height - borderTop - borderBottom,
	};

	const measured = [];
	const children = [];
	for ( const clientId of clientIds ) {
		const child = element.querySelector( `[data-block="${ clientId }"]` );
		if ( ! child ) {
			continue;
		}
		const childBox = toBox( child.getBoundingClientRect() );
		measured.push( clientId );
		children.push(
			measureByContents( clientId )
				? getVisibleBox( childBox, getContentBoxes( child ) )
				: childBox
		);
	}

	return children.length
		? { paddingBox, children, clientIds: measured }
		: null;
}

function toBox( rect ) {
	return {
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height,
	};
}

/**
 * The boxes of everything inside a block.
 *
 * Elements first; a block with none of those is text, which is measured with a
 * range over its contents — otherwise a paragraph would have nothing to be
 * measured by and would keep the full width it is laid out at.
 *
 * @param {Element} element A block's element.
 * @return {Object[]} The boxes, in viewport pixels.
 */
function getContentBoxes( element ) {
	const boxes = [];
	for ( const child of element.children ) {
		if ( isEditorFurniture( child.className ) ) {
			continue;
		}
		boxes.push( toBox( child.getBoundingClientRect() ) );
	}
	if ( boxes.length ) {
		return boxes;
	}

	const range = element.ownerDocument.createRange();
	range.selectNodeContents( element );
	return [ toBox( range.getBoundingClientRect() ) ];
}

/**
 * Whether an element is the editor's own chrome rather than the block.
 *
 * A block's element holds both. An Image block contains the image and a drop
 * zone stretched across the whole block, and measuring that drop zone makes
 * every image the full width of the canvas again — which leaves them all
 * stacked against the left edge, with nowhere sideways to go.
 *
 * The editor names its own furniture: `components-` for the component library,
 * `block-editor-` for the editor's own parts. A block's markup uses neither.
 *
 * @param {string} [className] An element's class attribute.
 * @return {boolean} Whether to leave it out of the measurement.
 */
export function isEditorFurniture( className ) {
	return String( className ?? '' )
		.split( ' ' )
		.some(
			( name ) =>
				name.startsWith( 'components-' ) ||
				name.startsWith( 'block-editor-' )
		);
}

/**
 * A stored rect, with a canvas-wide block cut down to what you can see.
 *
 * Conversion happens once. A section converted before blocks were measured by
 * their contents still holds blocks the full width of the canvas, and such a
 * block can never move sideways however it is dragged: there is nowhere for it
 * to go, so x stays 0 and everything is stacked against the left edge. Picking
 * one up is the moment to give it the size of the thing you can see.
 *
 * Only the sideways pinning is repaired. Moving a block up or down under the
 * hand, or changing its height as it is picked up, would be a surprise.
 *
 * @param {Object} [storedRect]  The rect the block is placed by.
 * @param {Object} [visibleRect] The rect of what is inside it.
 * @param {number} designWidth   The canvas width, in design units.
 * @return {Object|undefined} The rect to drag by.
 */
export function getRepairedRect( storedRect, visibleRect, designWidth ) {
	if ( ! storedRect || ! visibleRect ) {
		return storedRect;
	}

	const fillsTheCanvas = storedRect.x <= 0 && storedRect.width >= designWidth;
	const isNarrower =
		visibleRect.width > 0 && visibleRect.width < storedRect.width;
	if ( ! fillsTheCanvas || ! isNarrower ) {
		return storedRect;
	}

	return { ...storedRect, x: visibleRect.x, width: visibleRect.width };
}
