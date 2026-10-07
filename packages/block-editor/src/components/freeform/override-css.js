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
 * the rule that otherwise keeps every block `position: relative`.
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
	const { canvasHeight, rects } = canvas;
	// `collectCanvases` calls it `clientId`; callers passing one canvas by hand
	// use the longer name.
	const canvasClientId = canvas.canvasClientId ?? canvas.clientId;

	if ( ! canvasClientId ) {
		return '';
	}

	const percentage = ( value, extent ) =>
		`${ parseFloat( ( ( value / extent ) * 100 ).toFixed( 2 ) ) }%`;

	const rules = [
		`#block-${ canvasClientId } {
	position: relative;
	aspect-ratio: ${ DESIGN_WIDTH } / ${ canvasHeight };
}`,
		`#block-${ canvasClientId } > * {
	position: absolute;
	margin: 0;
}`,
	];

	for ( const [ clientId, rect ] of Object.entries( rects ) ) {
		rules.push(
			`#block-${ clientId } {
	left: ${ percentage( rect.x, DESIGN_WIDTH ) };
	top: ${ percentage( rect.y, canvasHeight ) };
	width: ${ percentage( rect.width, DESIGN_WIDTH ) };
	min-height: ${ percentage( rect.height, canvasHeight ) };
	box-sizing: border-box;
}`
		);
	}

	return rules.join( '\n' );
}
