import { setImmutably } from '../../utils/object';
import { getRotateForState, getUpdatedRotateStyle } from '../../hooks/rotate';
import type { BlockStyleState } from '../../hooks/types';
import type { Layout } from '../../layouts/types';
import type { BlockVisibility } from '../block-visibility/use-block-visibility';

const MOBILE_VIEWPORT = '@mobile';
const MOBILE_STATE: BlockStyleState = { viewport: MOBILE_VIEWPORT };

/**
 * The layout values that a grid or a grid item sets in its style attribute,
 * for the default state or a viewport state. `null` clears a value that the
 * default state sets.
 */
export interface GridStyleLayout {
	columnStart?: number;
	columnSpan?: number;
	rowStart?: number;
	rowSpan?: number;
	columnCount?: number | null;
	rowCount?: number | null;
	isManualPlacement?: boolean | null;
	stackOnMobile?: boolean;
	[ key: string ]: unknown;
}

/**
 * The parts of a grid's or a grid item's style attribute that mobile stacking
 * reads and writes.
 */
export interface GridBlockStyle {
	layout?: GridStyleLayout;
	'@mobile'?: {
		layout?: GridStyleLayout;
		[ key: string ]: unknown;
	};
	[ key: string ]: unknown;
}

/**
 * The attributes of a grid or a grid item that mobile stacking reads.
 */
export interface GridBlockAttributes {
	layout?: Layout;
	style?: GridBlockStyle;
	metadata?: {
		blockVisibility?: BlockVisibility;
		[ key: string ]: unknown;
	};
	[ key: string ]: unknown;
}

/**
 * A grid item, with its attributes.
 */
export interface GridChild {
	clientId: string;
	attributes?: GridBlockAttributes | null;
}

/**
 * A style attribute that has a mobile layout.
 */
export type GridBlockStyleWithMobileLayout = GridBlockStyle & {
	'@mobile': { layout: GridStyleLayout };
};

/**
 * Returns whether a grid stacks its children on mobile. Grids that use manual
 * placement on mobile stack, as part of the grid interactivity experiment,
 * when `stackOnMobile` is true. Both can be set for the default state or in
 * the grid's mobile layout.
 *
 * @param layout The grid's layout attribute.
 * @param style  The grid's style attribute.
 *
 * @return Whether the grid stacks on mobile.
 */
export function isGridStackedOnMobile(
	layout: Layout | undefined,
	style?: GridBlockStyle
): boolean {
	if ( ! window.__experimentalEnableGridInteractivity ) {
		return false;
	}
	const mobileLayout = { ...layout, ...style?.[ MOBILE_VIEWPORT ]?.layout };
	return (
		!! mobileLayout.isManualPlacement && mobileLayout.stackOnMobile === true
	);
}

/**
 * Returns whether a block is hidden on mobile by its block visibility, so
 * that it takes no place in a stacked grid.
 *
 * @param attributes The block's attributes.
 *
 * @return Whether the block is hidden on mobile.
 */
export function isBlockHiddenOnMobile(
	attributes: GridBlockAttributes | null | undefined
): boolean {
	const blockVisibility = attributes?.metadata?.blockVisibility;
	return (
		blockVisibility === false ||
		// `true` has no viewports, so it reads as `undefined` like no value.
		( blockVisibility as Exclude< BlockVisibility, boolean > | undefined )
			?.viewport?.mobile === false
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
 * @param options
 * @param options.gridClientId   Client ID of the grid.
 * @param options.gridAttributes Attributes of the grid.
 * @param options.children       The grid's children, in block order.
 *
 * @return Style updates, keyed by client ID.
 */
export function getUnstackedMobileUpdates( {
	gridClientId,
	gridAttributes,
	children,
}: {
	/**
	 * Any key that isn't a child's client ID works for the grid.
	 */
	gridClientId: string | symbol;
	gridAttributes: GridBlockAttributes | null | undefined;
	children: GridChild[];
} ): Record< string | symbol, { style: GridBlockStyleWithMobileLayout } > {
	const gridLayout = gridAttributes?.layout ?? {};
	const gridStyle = gridAttributes?.style ?? {};
	const columnCount =
		gridStyle[ MOBILE_VIEWPORT ]?.layout?.columnCount ??
		gridLayout.columnCount ??
		3;

	const updates: Record<
		string | symbol,
		{ style: GridBlockStyleWithMobileLayout }
	> = {};
	let row = 1;
	for ( const { clientId, attributes } of children ) {
		if ( isBlockHiddenOnMobile( attributes ) ) {
			continue;
		}
		const style = attributes?.style ?? {};
		const rowSpan = style.layout?.rowSpan ?? 1;
		// Setting a path on the style object keeps it an object.
		let nextStyle = setImmutably( style, [ MOBILE_VIEWPORT, 'layout' ], {
			...style[ MOBILE_VIEWPORT ]?.layout,
			columnStart: 1,
			columnSpan: columnCount,
			rowStart: row,
			rowSpan,
		} ) as GridBlockStyleWithMobileLayout;
		if ( getRotateForState( style, MOBILE_STATE ) ) {
			nextStyle = getUpdatedRotateStyle(
				nextStyle,
				0,
				MOBILE_STATE
			) as GridBlockStyleWithMobileLayout;
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
		} ) as GridBlockStyleWithMobileLayout,
	};

	return updates;
}

/**
 * Gets the layouts a stacked grid and one of its children show on mobile: the
 * mobile layouts that `getUnstackedMobileUpdates` would give them.
 *
 * @param gridAttributes Attributes of the grid.
 * @param children       The grid's children, in block order.
 * @param clientId       Client ID of the child.
 *
 * @return The child's layout, `undefined` when it is hidden on mobile, and the grid's layout.
 */
export function getStackedLayouts(
	gridAttributes: GridBlockAttributes | null | undefined,
	children: GridChild[],
	clientId: string
): { child: GridStyleLayout | undefined; grid: GridStyleLayout } {
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
