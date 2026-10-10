import { DEFAULT_CANVAS_HEIGHT, DESIGN_WIDTH } from './constants';
import { MARGIN, RHYTHM } from './snapping';

/**
 * The width a block is born at: the full content column.
 */
export const DEFAULT_BLOCK_WIDTH = DESIGN_WIDTH - MARGIN * 2;

/**
 * The height a block is assumed to be until it has been measured.
 */
const ASSUMED_BLOCK_HEIGHT = RHYTHM * 2;

/**
 * Reads the canvas's children as design-space rects.
 *
 * Position and width come from the stored layout, which is what the drag
 * writes and therefore authoritative. Height is measured from the DOM instead:
 * it is emitted as `min-height`, so a paragraph that wraps to more lines than
 * it was drawn for is genuinely taller than the stored value, and snapping has
 * to see the block people can see.
 *
 * A block with no coordinates at all is measured outright. That is what every
 * block in a section looks like before the section becomes a canvas, and the
 * editing surface has to sit over them where they really are.
 *
 * @param {Object}   options
 * @param {?Element} options.canvasElement    The canvas element, inside the iframe.
 * @param {string[]} options.childClientIds   The canvas's children, in order.
 * @param {Object}   options.childStyles      Block styles keyed by client id.
 * @param {number}   options.designToCanvasPx Canvas pixels per design unit.
 * @return {Object} Rects keyed by client id.
 */
export function readRects( {
	canvasElement,
	childClientIds,
	childStyles,
	designToCanvasPx,
} ) {
	const elements = {};
	if ( canvasElement ) {
		for ( const element of canvasElement.children ) {
			const clientId = element.dataset?.block;
			if ( clientId ) {
				elements[ clientId ] = element;
			}
		}
	}

	const rects = {};
	for ( const clientId of childClientIds ) {
		const layout = childStyles[ clientId ]?.layout ?? {};
		const element = elements[ clientId ];
		const measure =
			element && designToCanvasPx
				? ( pixels ) => pixels / designToCanvasPx
				: null;

		rects[ clientId ] = {
			x: Math.round(
				layout.x ?? ( measure ? measure( element.offsetLeft ) : 0 )
			),
			y: Math.round(
				layout.y ?? ( measure ? measure( element.offsetTop ) : 0 )
			),
			width: Math.round(
				layout.width ??
					( measure
						? measure( element.offsetWidth )
						: DEFAULT_BLOCK_WIDTH )
			),
			height: Math.round(
				( measure ? measure( element.offsetHeight ) : null ) ??
					layout.height ??
					ASSUMED_BLOCK_HEIGHT
			),
		};
	}

	return rects;
}

/**
 * Whether a block has been placed on the canvas yet.
 *
 * @param {Object} layout A child's layout attributes.
 * @return {boolean} True when the block has coordinates.
 */
export function isPlaced( layout ) {
	return layout?.x !== undefined && layout?.y !== undefined;
}

/**
 * Where an unplaced block should be born: at the content margin, below
 * everything already on the canvas.
 *
 * @param {Object[]} placedRects Rects already on the canvas.
 * @return {{x: number, y: number, width: number}} The starting placement.
 */
export function getBirthPlacement( placedRects ) {
	const lowestBottom = placedRects.reduce(
		( lowest, rect ) => Math.max( lowest, rect.y + rect.height ),
		0
	);
	return {
		x: MARGIN,
		y: placedRects.length ? lowestBottom + RHYTHM : MARGIN,
		width: DEFAULT_BLOCK_WIDTH,
	};
}

/**
 * The canvas height needed to hold everything on it, never shrinking below the
 * height the canvas already has.
 *
 * @param {Object[]} rects         Every rect on the canvas.
 * @param {number}   currentHeight The canvas's current design height.
 * @return {number} The height the canvas should have.
 */
export function getRequiredCanvasHeight( rects, currentHeight ) {
	const lowestBottom = rects.reduce(
		( lowest, rect ) => Math.max( lowest, rect.y + rect.height ),
		0
	);
	return Math.max(
		currentHeight ?? DEFAULT_CANVAS_HEIGHT,
		Math.ceil( lowestBottom + MARGIN )
	);
}
