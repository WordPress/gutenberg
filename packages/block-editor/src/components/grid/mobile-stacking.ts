import { setImmutably } from '../../utils/object';
import type { Layout } from '../../layouts/types';
import type { BlockVisibility } from '../block-visibility/use-block-visibility';
import type { GridItemBox } from './free-placement';

const MOBILE_VIEWPORT = '@mobile';

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
	/** Where a block placed freely in a manual grid is inside its cells. */
	box?: GridItemBox;
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
 * they are.
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
		updates[ clientId ] = {
			// Setting a path on the style object keeps it an object.
			style: setImmutably( style, [ MOBILE_VIEWPORT, 'layout' ], {
				...style[ MOBILE_VIEWPORT ]?.layout,
				columnStart: 1,
				columnSpan: columnCount,
				rowStart: row,
				rowSpan,
			} ) as GridBlockStyleWithMobileLayout,
		};
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

// A block placed freely also has a box inside its cells.
const PLACEMENT_KEYS = [
	'columnStart',
	'columnSpan',
	'rowStart',
	'rowSpan',
	'box',
];

/**
 * Builds the block updates that remove the mobile placement of a grid's
 * children. A stacked grid ignores these placements, so turning stacking back
 * on removes them, including the ones `getUnstackedMobileUpdates` wrote, and
 * they don't stay in the content unused. Empty objects left behind are
 * removed too.
 *
 * @param children The grid's children.
 *
 * @return Style updates, keyed by client ID, for the children that have a mobile placement.
 */
export function getMobilePlacementResets(
	children: GridChild[]
): Record< string, { style: GridBlockStyle | undefined } > {
	const updates: Record< string, { style: GridBlockStyle | undefined } > = {};
	for ( const { clientId, attributes } of children ) {
		const style = attributes?.style;
		const mobileStyle = style?.[ MOBILE_VIEWPORT ];
		const mobileLayout = mobileStyle?.layout;
		if (
			! style ||
			! mobileStyle ||
			! mobileLayout ||
			! PLACEMENT_KEYS.some( ( key ) =>
				Object.hasOwn( mobileLayout, key )
			)
		) {
			continue;
		}
		const nextMobileLayout = Object.fromEntries(
			Object.entries( mobileLayout ).filter(
				( [ key ] ) => ! PLACEMENT_KEYS.includes( key )
			)
		);
		const { layout, ...nextMobileStyle } = mobileStyle;
		if ( Object.keys( nextMobileLayout ).length ) {
			nextMobileStyle.layout = nextMobileLayout;
		}
		const { [ MOBILE_VIEWPORT ]: mobile, ...nextStyle } = style;
		if ( Object.keys( nextMobileStyle ).length ) {
			nextStyle[ MOBILE_VIEWPORT ] = nextMobileStyle;
		}
		updates[ clientId ] = {
			style: Object.keys( nextStyle ).length ? nextStyle : undefined,
		};
	}
	return updates;
}

/**
 * The layouts a stacked grid and its children show on mobile.
 */
export interface StackedGridLayouts {
	grid: GridStyleLayout;
	/**
	 * Keyed by client ID. Blocks hidden on mobile take no place in the stack,
	 * so they have no layout.
	 */
	children: Record< string, GridStyleLayout >;
}

/**
 * Gets the layouts a stacked grid and its children show on mobile: the mobile
 * layouts that `getUnstackedMobileUpdates` would give them.
 *
 * @param gridAttributes Attributes of the grid.
 * @param children       The grid's children, in block order.
 *
 * @return The grid's layout, and its children's layouts.
 */
export function getStackedLayouts(
	gridAttributes: GridBlockAttributes | null | undefined,
	children: GridChild[]
): StackedGridLayouts {
	// Any key that isn't a child's client ID works for the grid.
	const gridKey = Symbol( 'grid' );
	const updates = getUnstackedMobileUpdates( {
		gridClientId: gridKey,
		gridAttributes,
		children,
	} );
	const childLayouts: Record< string, GridStyleLayout > = {};
	for ( const { clientId } of children ) {
		if ( updates[ clientId ] ) {
			childLayouts[ clientId ] =
				updates[ clientId ].style[ MOBILE_VIEWPORT ].layout;
		}
	}
	return {
		grid: updates[ gridKey ].style[ MOBILE_VIEWPORT ].layout,
		children: childLayouts,
	};
}
