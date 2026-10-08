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
`;
}

/**
 * The rules that say a block is moved rather than typed into.
 *
 * Keyed on the blocks themselves rather than on a canvas's children, because
 * the blocks a canvas can move are not always its children yet: an item in a
 * column becomes one on the first drag, and until then a `> *` rule never
 * reaches it. In the theme patterns almost everything is nested inside a
 * Columns or a wrapper Group, so almost nothing would be covered.
 *
 * Nor is this about placement. A block with no coordinates — one just
 * inserted, or anything in a section nobody has dragged in — is still a block
 * you can pick up, so the two cannot be decided by the same rule.
 *
 * The cursor stops at the block, with one exception. A block that arranges its
 * own children is all one thing — a Buttons block is its buttons — and the only
 * pixels you can press belong to a button's label, so those say move too.
 * Elsewhere it stops: a Group kept whole on a canvas travels as one piece, and
 * the words inside it are still words. The entered
 * block is excluded rather than reset, so the editor goes on saying what the
 * cursor over real text is.
 *
 * `-webkit-user-drag` is what stops an image being carried off by the browser
 * instead of moved on the canvas. An image is draggable by default, and that
 * native drag swallows the pointer stream the instant it starts: the press
 * arrives, `dragstart` fires, and no further move or release is ever seen, so
 * the gesture never finishes and the block stays where it was.
 *
 * It is the one thing said about what is inside a block, because the image is
 * inside the Image block rather than being it, and the property is not
 * inherited. It only governs the browser's own dragging, so it takes nothing
 * away from the text in a block that is kept whole.
 *
 * It stops at the block's contents and does not touch the block itself. The
 * editor marks a block `draggable`, and that is what a press on an unselected
 * block falls back to: the canvas is mounted by the selection, so on a cold
 * press there is no canvas to take the gesture, and refusing the browser's
 * drag as well left such a press doing nothing whatsoever. Suppressing the
 * image alone is enough for the case this came from — a block already selected,
 * where the canvas is mounted and the gesture is ready — and that is the case
 * where the image was being carried off mid-drag.
 *
 * @param {string[]} clientIds      Every block the canvas can move.
 * @param {string[]} wholeClientIds Those of them that are all one thing, whose
 *                                  contents show the move cursor as well.
 * @return {string} CSS for the editor canvas.
 */
export function getMoveModeCss( clientIds, wholeClientIds = [] ) {
	const whole = new Set( wholeClientIds );
	return clientIds
		.map( ( clientId ) => {
			const insideDeclarations = [ '-webkit-user-drag: none' ];
			if ( whole.has( clientId ) ) {
				insideDeclarations.push( 'cursor: move' );
			}
			return `#block-${ clientId }:not([contenteditable="true"]) {
	cursor: move;
	user-select: none;
}
#block-${ clientId }:not([contenteditable="true"]) * {
	${ insideDeclarations.join( ';\n\t' ) };
}`;
		} )
		.join( '\n' );
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
