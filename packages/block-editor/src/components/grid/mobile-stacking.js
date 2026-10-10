import { setImmutably } from '../../utils/object';
import { getRotateForState, getUpdatedRotateStyle } from '../../hooks/rotate';

const MOBILE_VIEWPORT = '@mobile';
const MOBILE_STATE = { viewport: MOBILE_VIEWPORT };

/**
 * Returns whether a grid stacks its children on mobile. Grids that use manual
 * placement on mobile stack, as part of the grid interactivity experiment,
 * unless `stackOnMobile` is false. Both can be set for the default state or in
 * the grid's mobile layout.
 *
 * @param {Object|undefined} layout The grid's layout attribute.
 * @param {Object|undefined} style  The grid's style attribute.
 *
 * @return {boolean} Whether the grid stacks on mobile.
 */
export function isGridStackedOnMobile( layout, style ) {
	if ( ! window.__experimentalEnableGridInteractivity ) {
		return false;
	}
	const mobileLayout = { ...layout, ...style?.[ MOBILE_VIEWPORT ]?.layout };
	return (
		!! mobileLayout.isManualPlacement &&
		mobileLayout.stackOnMobile !== false
	);
}

/**
 * Returns whether a block is hidden on mobile by its block visibility, so
 * that it takes no place in a stacked grid.
 *
 * @param {Object|undefined} attributes The block's attributes.
 *
 * @return {boolean} Whether the block is hidden on mobile.
 */
export function isBlockHiddenOnMobile( attributes ) {
	const blockVisibility = attributes?.metadata?.blockVisibility;
	return (
		blockVisibility === false || blockVisibility?.viewport?.mobile === false
	);
}

/**
 * Builds the block updates that give a stacked grid its own mobile layout,
 * starting from the stack shown on mobile so that nothing moves.
 *
 * The grid stops stacking on mobile and gets a mobile column and row count.
 * Each child gets a mobile override that matches its place in the stack: the
 * full width of the grid, one after another in block order, keeping its row
 * span. Blocks hidden on mobile take no place in the stack and are left as
 * they are. A child rotated on mobile gets a mobile rotation of 0, since
 * stacked blocks are shown unrotated.
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
		if ( isBlockHiddenOnMobile( attributes ) ) {
			continue;
		}
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

/**
 * Gets the layouts a stacked grid and one of its children show on mobile: the
 * mobile layouts that `getUnstackedMobileUpdates` would give them.
 *
 * @param {Object}                                        gridAttributes Attributes of the grid.
 * @param {Array<{clientId: string, attributes: Object}>} children       The grid's children, in block order.
 * @param {string}                                        clientId       Client ID of the child.
 *
 * @return {{child: (Object|undefined), grid: Object}} The child's layout, `undefined` when it is hidden on mobile, and the grid's layout.
 */
export function getStackedLayouts( gridAttributes, children, clientId ) {
	// Any key that isn't a child's client ID works for the grid.
	const gridKey = Symbol( 'grid' );
	const updates = getUnstackedMobileUpdates( {
		gridClientId: gridKey,
		gridAttributes,
		children,
	} );
	return {
		child: updates[ clientId ]?.style[ MOBILE_VIEWPORT ].layout,
		grid: updates[ gridKey ].style[ MOBILE_VIEWPORT ].layout,
	};
}
