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
 * theme background. `overflow-x: clip` keeps `100vw` content out of it.
 *
 * @param {boolean} isCompact Whether to reserve the compact width only.
 * @return {string} CSS for the canvas document.
 */
export function getCanvasMarginCSS( isCompact ) {
	const tiers = isCompact ? [ COMPACT_TIER ] : [ COMPACT_TIER, FULL_TIER ];
	return tiers
		.map(
			( { minCanvasWidth, width } ) =>
				`@media (min-width:${ minCanvasWidth }px){:root{padding-inline-end:${ width }px;}body{overflow-x:clip;}:root::after{content:"";position:fixed;inset-block:0;inset-inline-end:${
					width - 1
				}px;width:1px;background:color-mix(in srgb,currentColor 10%,transparent);pointer-events:none;}}`
		)
		.join( '' );
}
