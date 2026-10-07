import { DEFAULT_CANVAS_HEIGHT } from './constants';
import { isPlaced } from './rects';

/**
 * Every canvas in a block tree, at any depth, with the children it has placed.
 *
 * A canvas's stylesheet cannot be tied to the selection. The blocks in a
 * converted section never re-render (see `override-css.js`), so the stylesheet
 * is the only thing holding them in place — drop it because the selection moved
 * elsewhere and the whole section falls back into flow. Every canvas in the
 * post is therefore styled all the time, whether or not anything in it is
 * selected, and canvases nested inside other canvases are found too.
 *
 * @param {Object[]} blocks A block tree.
 * @return {Object[]} One entry per canvas, outermost first.
 */
export function collectCanvases( blocks ) {
	const canvases = [];

	const walk = ( list ) => {
		for ( const block of list ) {
			if ( block.attributes?.layout?.type === 'freeform' ) {
				const rects = {};
				for ( const child of block.innerBlocks ?? [] ) {
					const layout = child.attributes?.style?.layout;
					if ( isPlaced( layout ) ) {
						rects[ child.clientId ] = layout;
					}
				}
				canvases.push( {
					clientId: block.clientId,
					canvasHeight:
						block.attributes.layout.canvasHeight ??
						DEFAULT_CANVAS_HEIGHT,
					rects,
				} );
			}
			if ( block.innerBlocks?.length ) {
				walk( block.innerBlocks );
			}
		}
	};

	walk( blocks );
	return canvases;
}

/**
 * Whether a container's own layout is open enough to become a canvas.
 *
 * Some blocks exist precisely to arrange their children — Columns, Buttons,
 * Navigation, Gallery, the paginations — and every one of them says so with
 * `allowSwitching: false`. Turning those into a canvas would throw away the
 * arrangement the block is for. Everything else that supports layout is fair
 * game: a Group, a Column, a Cover all simply hold whatever you put in them.
 *
 * @param {boolean|Object|undefined} layoutSupport The block's `layout` support.
 * @return {boolean} Whether blocks inside it can be placed by dragging.
 */
export function canHoldACanvas( layoutSupport ) {
	if ( ! layoutSupport ) {
		return false;
	}
	return layoutSupport?.allowSwitching !== false;
}

/**
 * The layout a canvas should have once it has grown to fit its contents.
 *
 * `type` is set rather than merged. Growing happens when a gesture ends, and
 * the layout it merges into may be the one captured before that very gesture
 * converted the container — spreading it would write the old type back, the
 * canvas would stop being a canvas, and its blocks would drop into flow while
 * their stored coordinates, and so the editing surface, stayed where they were
 * put. That reads as the outline moving while the content does not.
 *
 * @param {Object|undefined} layout         The container's layout attribute.
 * @param {number}           requiredHeight The height it needs, in design units.
 * @return {Object} The layout to write.
 */
export function getGrownCanvasLayout( layout, requiredHeight ) {
	return {
		...layout,
		type: 'freeform',
		canvasHeight: requiredHeight,
	};
}
