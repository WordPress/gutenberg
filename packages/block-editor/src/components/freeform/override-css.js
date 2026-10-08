import { DESIGN_WIDTH } from './constants';

/**
 * The stylesheet that actually positions a canvas and everything on it.
 *
 * This is the gogh approach, and it is here for the reason gogh uses it: a
 * canvas cannot depend on the editor re-rendering blocks. Changing a block's
 * layout while one of its children is selected does not re-render that block,
 * and writing the children's coordinates does not re-render the unselected
 * ones — so a canvas driven purely by block attributes renders the old layout
 * and collapses. Owning the stylesheet sidesteps all of it: this component
 * re-renders on every store change, and the CSS it emits is the truth on screen.
 *
 * Blocks are addressed by id. `#block-…` is 1-0-0, which outranks the editor's
 * `.block-editor-block-list__layout .block-editor-block-list__block` at 0-2-0 —
 * the rule that otherwise keeps every block `position: relative` — and its
 * `…__block[contenteditable]` at 0-3-0, which otherwise puts a text cursor on a
 * block that is in move mode, since that attribute selector matches
 * `contenteditable="false"` just as happily as `"true"`.
 *
 * Saying a block is in move mode belongs here for the same reason its position
 * does: a section that has just become a canvas has not re-rendered, so its
 * element does not carry `is-layout-freeform` and nothing keyed on that class
 * applies. The cursor and the suppressed text selection would both wait for a
 * reload.
 *
 * Block attributes are still written, because they are what gets saved and what
 * the front end renders from. They are just not what the editor leans on.
 *
 * @param {Object}  canvas              One entry from `collectCanvases`.
 * @param {?string} canvas.clientId     The canvas block.
 * @param {number}  canvas.canvasHeight Canvas height in design units.
 * @param {Object}  canvas.rects        Design-space rect per child client id.
 * @return {string} CSS for the editor canvas.
 */
export function getCanvasOverrideCss( canvas ) {
	return [ getCanvasRules( canvas ), getPlacementRules( canvas ) ]
		.filter( Boolean )
		.join( '\n' );
}

/**
 * The rules that make a container a canvas.
 *
 * @param {Object}  canvas                One entry from `collectCanvases`.
 * @param {?string} canvas.clientId       The canvas block.
 * @param {?string} canvas.canvasClientId The canvas block, named the long way.
 * @param {number}  canvas.canvasHeight   Canvas height in design units.
 * @return {string} CSS.
 */
function getCanvasRules( {
	clientId,
	canvasClientId = clientId,
	canvasHeight,
} ) {
	if ( ! canvasClientId ) {
		return '';
	}
	return `#block-${ canvasClientId } {
	position: relative;
	aspect-ratio: ${ DESIGN_WIDTH } / ${ canvasHeight };
	container-type: inline-size;
}
#block-${ canvasClientId } > * {
	margin: 0;
}
${ getMoveModeRules( canvasClientId ) }`;
}

/**
 * The rules that say the blocks on a canvas are moved rather than typed into.
 *
 * One rule for the canvas rather than one per block, because every child is in
 * move mode whether or not it has coordinates yet — a block just inserted, or
 * every block in a section nobody has dragged in.
 *
 * `> *` is deliberate: a Group kept whole on a canvas travels as one piece, and
 * the words inside it are still words. The entered block is excluded rather
 * than reset, so the editor goes on saying what the cursor over real text is.
 *
 * @param {string} canvasClientId The canvas block.
 * @return {string} CSS.
 */
function getMoveModeRules( canvasClientId ) {
	return `#block-${ canvasClientId } > *:not([contenteditable="true"]) {
	cursor: move;
	user-select: none;
}`;
}

/**
 * The stylesheet for a section that is a canvas waiting to happen.
 *
 * Its blocks are already held still — RichText sees to that — so they must
 * already say they can be moved. Nothing is positioned: the section is still
 * laying itself out, and coordinates it has not been measured for would
 * collapse it onto a single spot.
 *
 * @param {string[]} clientIds Sections that could become canvases.
 * @return {string} CSS for the editor canvas.
 */
export function getPendingCanvasCss( clientIds ) {
	return clientIds.map( getMoveModeRules ).join( '\n' );
}

/**
 * The rules that place each block on a canvas, and say it can be moved.
 *
 * `position` is set here, on the block itself, rather than on the canvas's
 * children collectively. A canvas nested on another canvas is both a container
 * and a placed block, and these rules are written after every container rule so
 * that the placement wins — otherwise the nested canvas keeps the `position:
 * relative` it gets for being a canvas, ignores the coordinates its parent gave
 * it, and sits wherever flow leaves it while the editing surface shows it where
 * it was dropped.
 *
 * @param {Object}  canvas                One entry from `collectCanvases`.
 * @param {?string} canvas.clientId       The canvas block.
 * @param {?string} canvas.canvasClientId The canvas block, named the long way.
 * @param {number}  canvas.canvasHeight   Canvas height in design units.
 * @param {Object}  canvas.rects          Design-space rect per child client id.
 * @return {string} CSS.
 */
function getPlacementRules( {
	clientId,
	canvasClientId = clientId,
	canvasHeight,
	rects,
} ) {
	if ( ! canvasClientId ) {
		return '';
	}
	const percentage = ( value, extent ) =>
		`${ parseFloat( ( ( value / extent ) * 100 ).toFixed( 2 ) ) }%`;

	return Object.entries( rects )
		.map( ( [ childClientId, rect ] ) => {
			const declarations = [
				'position: absolute',
				`left: ${ percentage( rect.x, DESIGN_WIDTH ) }`,
				`top: ${ percentage( rect.y, canvasHeight ) }`,
			];
			// A drag writes x and y only, so a block that had no stored height
			// still has none. Leave the size to the content rather than
			// writing a measurement that does not exist.
			if ( Number.isFinite( rect.width ) ) {
				declarations.push(
					`width: ${ percentage( rect.width, DESIGN_WIDTH ) }`
				);
			}
			if ( Number.isFinite( rect.height ) ) {
				declarations.push(
					`min-height: ${ percentage( rect.height, canvasHeight ) }`
				);
			}
			declarations.push( 'box-sizing: border-box' );
			// Above the lattice, which is painted at z-index 0.
			declarations.push( 'z-index: 1' );
			return `#block-${ childClientId } {\n\t${ declarations.join(
				';\n\t'
			) };\n}`;
		} )
		.join( '\n' );
}

/**
 * The stylesheet for every canvas in the post.
 *
 * Containers first, placements second, so a canvas nested on another canvas is
 * placed by its parent rather than keeping the `position: relative` it gets for
 * being a canvas itself.
 *
 * @param {Object[]} canvases From `collectCanvases`.
 * @return {string} CSS for the editor canvas.
 */
export function getCanvasesCss( canvases ) {
	return [
		...canvases.map( getCanvasRules ),
		...canvases.map( getPlacementRules ),
	]
		.filter( Boolean )
		.join( '\n' );
}
