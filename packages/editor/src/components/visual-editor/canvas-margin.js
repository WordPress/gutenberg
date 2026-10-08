import { createSlotFill } from '@wordpress/components';

/**
 * Canvas margin for UI beside the content. The canvas reserves space while a
 * fill renders.
 */
export const CanvasMargin = createSlotFill( Symbol( 'EditorCanvasMargin' ) );

// Reserved widths by the minimum canvas width that fits them. Keep in sync
// with `style.scss`.
export const FULL_TIER = { minCanvasWidth: 880, width: 280 };
const COMPACT_TIER = { minCanvasWidth: 482, width: 82 };

/**
 * Returns the CSS that reserves the margin inside the canvas, so it gets the
 * theme background. `overflow-x: clip` keeps `100vw` content out of it. A fill
 * may set `--wp-editor-canvas-min-height` on the canvas root so its lowest
 * content can scroll into view on a short canvas; the room goes away with the
 * margin.
 *
 * @param {boolean} isCompact Whether to reserve the compact width only.
 * @return {string} CSS for the canvas document.
 */
export function getCanvasMarginCSS( isCompact ) {
	const tiers = isCompact ? [ COMPACT_TIER ] : [ COMPACT_TIER, FULL_TIER ];
	// Non-inherited, so a change restyles the root alone, not the document.
	const roomProperty =
		'@property --wp-editor-canvas-min-height{syntax:"<length>";inherits:false;initial-value:0px;}';
	return (
		roomProperty +
		tiers
			.map( ( { minCanvasWidth, width } ) => {
				// On `body`, where themes set the text color.
				const divider = `body::before{content:"";position:fixed;inset-block:0;inset-inline-end:${
					width - 1
				}px;width:1px;background:color-mix(in srgb,currentColor 10%,transparent);pointer-events:none;}`;
				return `@media (min-width:${ minCanvasWidth }px){:root{padding-inline-end:${ width }px;min-height:var(--wp-editor-canvas-min-height,0);}body{overflow-x:clip;}${ divider }}`;
			} )
			.join( '' )
	);
}
