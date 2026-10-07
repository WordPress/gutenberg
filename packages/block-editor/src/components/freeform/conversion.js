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
 * Measures a section in the editor, ready for `getCanvasConversion`.
 *
 * Children are measured against the padding box rather than the border box,
 * because that is what an absolutely positioned child is placed against.
 *
 * @param {Element} element The section's element, inside the editor canvas.
 * @return {?{paddingBox: Object, children: Object[], clientIds: string[]}} The
 *         measurements, or null when the section has no blocks in it.
 */
export function measureSection( element ) {
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

	const clientIds = [];
	const children = [];
	for ( const child of element.children ) {
		const clientId = child.dataset?.block;
		if ( ! clientId ) {
			continue;
		}
		const childBox = child.getBoundingClientRect();
		clientIds.push( clientId );
		children.push( {
			left: childBox.left,
			top: childBox.top,
			width: childBox.width,
			height: childBox.height,
		} );
	}

	return children.length ? { paddingBox, children, clientIds } : null;
}
