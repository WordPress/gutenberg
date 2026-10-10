import { setImmutably } from '../../utils/object';
import { getRotateForState, getUpdatedRotateStyle } from '../../hooks/rotate';

const MOBILE_VIEWPORT = '@mobile';
const MOBILE_STATE = { viewport: MOBILE_VIEWPORT };

/**
 * Returns whether a grid stacks its children on mobile. Manual placement grids
 * stack, as part of the grid interactivity experiment, unless `stackOnMobile`
 * is false, which can be set for the default state or in the grid's mobile
 * layout.
 *
 * @param {Object|undefined} layout The grid's layout attribute.
 * @param {Object|undefined} style  The grid's style attribute.
 *
 * @return {boolean} Whether the grid stacks on mobile.
 */
export function isGridStackedOnMobile( layout, style ) {
	if (
		! layout?.isManualPlacement ||
		! window.__experimentalEnableGridInteractivity
	) {
		return false;
	}
	const mobileLayout = { ...layout, ...style?.[ MOBILE_VIEWPORT ]?.layout };
	return mobileLayout.stackOnMobile !== false;
}

/**
 * Builds the block updates that give a stacked grid its own mobile layout,
 * starting from the stack shown on mobile so that nothing moves.
 *
 * The grid stops stacking on mobile and gets a mobile column and row count.
 * Each child gets a mobile override that matches its place in the stack: the
 * full width of the grid, one after another in block order, keeping its row
 * span. A child rotated on mobile gets a mobile rotation of 0, since stacked
 * blocks are shown unrotated.
 *
 * @param {Object}                                        options
 * @param {string}                                        options.gridClientId   Client ID of the grid.
 * @param {Object}                                        options.gridAttributes Attributes of the grid.
 * @param {Array<{clientId: string, attributes: Object}>} options.children       The grid's children, in block order.
 *
 * @return {Object<string, {style: Object}>} Style updates, keyed by client ID.
 */
export function getUnstackedMobileUpdates( {
	gridClientId,
	gridAttributes,
	children,
} ) {
	const gridLayout = gridAttributes?.layout ?? {};
	const gridStyle = gridAttributes?.style ?? {};
	const columnCount =
		gridStyle[ MOBILE_VIEWPORT ]?.layout?.columnCount ??
		gridLayout.columnCount ??
		3;

	const updates = {};
	let row = 1;
	for ( const { clientId, attributes } of children ) {
		const style = attributes?.style ?? {};
		const rowSpan = style.layout?.rowSpan ?? 1;
		let nextStyle = setImmutably( style, [ MOBILE_VIEWPORT, 'layout' ], {
			...style[ MOBILE_VIEWPORT ]?.layout,
			columnStart: 1,
			columnSpan: columnCount,
			rowStart: row,
			rowSpan,
		} );
		if ( getRotateForState( style, MOBILE_STATE ) ) {
			nextStyle = getUpdatedRotateStyle( nextStyle, 0, MOBILE_STATE );
		}
		updates[ clientId ] = { style: nextStyle };
		row += rowSpan;
	}

	updates[ gridClientId ] = {
		style: setImmutably( gridStyle, [ MOBILE_VIEWPORT, 'layout' ], {
			...gridStyle[ MOBILE_VIEWPORT ]?.layout,
			stackOnMobile: false,
			columnCount,
			rowCount: Math.max( row - 1, 1 ),
		} ),
	};

	return updates;
}
