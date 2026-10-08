import { setImmutably } from '../../utils/object';

const MOBILE_VIEWPORT = '@mobile';

/**
 * Returns whether a grid stacks its children on mobile. Manual placement grids
 * stack unless `stackOnMobile` is false, which can be set for the default
 * state or in the grid's mobile layout.
 *
 * @param {Object|undefined} layout The grid's layout attribute.
 * @param {Object|undefined} style  The grid's style attribute.
 *
 * @return {boolean} Whether the grid stacks on mobile.
 */
export function isGridStackedOnMobile( layout, style ) {
	if ( ! layout?.isManualPlacement ) {
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
 * span, and unrotated.
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
		updates[ clientId ] = {
			style: setImmutably( style, [ MOBILE_VIEWPORT, 'layout' ], {
				...style[ MOBILE_VIEWPORT ]?.layout,
				columnStart: 1,
				columnSpan: columnCount,
				rowStart: row,
				rowSpan,
				rotate: 0,
			} ),
		};
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
