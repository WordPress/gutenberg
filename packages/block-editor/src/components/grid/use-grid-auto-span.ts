import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { getBlockAttributesNamesByRole } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import {
	getGridItemPlacement,
	getGridTracks,
	getRequiredGridRowCount,
	GridRect,
} from './utils';
import type { Layout } from '../../layouts/types';
import type { GridItemAttributes } from './types';

interface AutoSpanItemState {
	appliedRect: GridRect;
	attributes: GridItemAttributes;
	userColumnStart: number;
	userRowStart: number;
	extraColumnSpan: number;
	extraRowSpan: number;
	autoColumnSpan: number;
	autoRowSpan: number;
	gridWidth: number;
	hasUserColumnSpanOverride: boolean;
	hasUserRowSpanOverride: boolean;
	preserveUserResize: boolean;
	columnSpanWasImplicit: boolean;
	rowSpanWasImplicit: boolean;
}

interface AutoSpanState {
	items: Map< string, AutoSpanItemState >;
	rows?: {
		base: number;
		applied: number;
	};
}

interface GridItemDimensions {
	offsetWidth: number;
	offsetHeight: number;
	scrollWidth: number;
	scrollHeight: number;
}

// Keep automatic span baselines across editor canvas remounts, such as when
// switching previews. Client IDs are unique within an editor session.
const autoSpanStates = new Map< string, AutoSpanState >();

const LAYOUT_STYLE_KEY = new Set( [ 'layout' ] );
const GRID_PLACEMENT_KEYS = new Set( [
	'columnStart',
	'rowStart',
	'columnSpan',
	'rowSpan',
] );

/**
 * Checks whether two objects are shallowly equal, ignoring selected keys.
 *
 * @param first       First object.
 * @param second      Second object.
 * @param ignoredKeys Keys to ignore.
 *
 * @return Whether the remaining values are equal.
 */
function areObjectsEqualExcept(
	first: Record< string, unknown > | undefined,
	second: Record< string, unknown > | undefined,
	ignoredKeys: ReadonlySet< string >
): boolean {
	if ( first === second ) {
		return true;
	}
	const firstKeys = Object.keys( first ?? {} ).filter(
		( key ) => ! ignoredKeys.has( key )
	);
	const secondKeys = Object.keys( second ?? {} ).filter(
		( key ) => ! ignoredKeys.has( key )
	);
	return (
		firstKeys.length === secondKeys.length &&
		firstKeys.every(
			( key ) =>
				Object.hasOwn( second ?? {}, key ) &&
				Object.is( first?.[ key ], second?.[ key ] )
		)
	);
}

/**
 * Checks whether the content attributes of a block are unchanged.
 *
 * @param first                First set of block attributes.
 * @param second               Second set of block attributes.
 * @param contentAttributeKeys Names of attributes with the content role.
 *
 * @return Whether the content attributes are equal.
 */
function areContentAttributesEqual(
	first: GridItemAttributes,
	second: GridItemAttributes,
	contentAttributeKeys: readonly string[]
): boolean {
	return contentAttributeKeys.every( ( key ) =>
		Object.is( first[ key ], second[ key ] )
	);
}

/**
 * Checks whether user-controlled attributes other than content and grid
 * placement are unchanged.
 *
 * @param first                First set of block attributes.
 * @param second               Second set of block attributes.
 * @param contentAttributeKeys Names of attributes with the content role.
 *
 * @return Whether the user-controlled attributes are equal.
 */
function areUserControlledAttributesEqual(
	first: GridItemAttributes,
	second: GridItemAttributes,
	contentAttributeKeys: readonly string[]
): boolean {
	return (
		areObjectsEqualExcept(
			first,
			second,
			new Set( [ 'style', ...contentAttributeKeys ] )
		) &&
		areObjectsEqualExcept( first.style, second.style, LAYOUT_STYLE_KEY ) &&
		areObjectsEqualExcept(
			first.style?.layout,
			second.style?.layout,
			GRID_PLACEMENT_KEYS
		)
	);
}

/**
 * Checks whether a value is a positive integer.
 *
 * @param value Value to check.
 *
 * @return Whether the value is a positive integer.
 */
function isPositiveInteger( value: unknown ): value is number {
	return typeof value === 'number' && Number.isInteger( value ) && value > 0;
}

/**
 * Parses a computed CSS length, falling back to zero for a nonnumeric value.
 *
 * @param value Computed CSS length.
 *
 * @return Parsed pixel value.
 */
function getCSSPixelValue( value: string ): number {
	const number = parseFloat( value );
	return Number.isFinite( number ) ? number : 0;
}

/**
 * Checks whether two grid rectangles have the same position and size.
 *
 * @param first  First grid rectangle.
 * @param second Second grid rectangle.
 *
 * @return Whether the rectangles are equal.
 */
function areGridRectsEqual( first: GridRect, second: GridRect ): boolean {
	return (
		first.columnStart === second.columnStart &&
		first.rowStart === second.rowStart &&
		first.columnSpan === second.columnSpan &&
		first.rowSpan === second.rowSpan
	);
}

/**
 * Measures a grid item while it occupies a particular grid rectangle. The
 * temporary inline styles are restored before the browser paints.
 *
 * @param element   Grid item element.
 * @param rect      Grid rectangle to measure.
 * @param rowHeight Height of a grid row in pixels.
 *
 * @return Grid item dimensions at the requested size.
 */
function measureElementAtRect(
	element: HTMLElement,
	rect: GridRect,
	rowHeight: number
): GridItemDimensions {
	const gridStyle = element.parentElement!.style;
	const overrides: [ CSSStyleDeclaration, string, string ][] = [
		[
			element.style,
			'grid-column',
			`${ rect.columnStart } / span ${ rect.columnSpan }`,
		],
		[
			element.style,
			'grid-row',
			`${ rect.rowStart } / span ${ rect.rowSpan }`,
		],
		// Keep tracks fixed while measuring, including any implicit rows that
		// would become explicit when the grid's row count is updated.
		[
			gridStyle,
			'grid-template-rows',
			`repeat(${ rect.rowEnd }, ${ rowHeight }px)`,
		],
		[ gridStyle, 'grid-auto-rows', `${ rowHeight }px` ],
	];
	const restoreStyles = overrides.map( ( [ style, property, value ] ) => {
		const previousValue = style.getPropertyValue( property );
		const previousPriority = style.getPropertyPriority( property );
		style.setProperty( property, value );
		return () => {
			if ( previousValue ) {
				style.setProperty( property, previousValue, previousPriority );
			} else {
				style.removeProperty( property );
			}
		};
	} );

	let dimensions: GridItemDimensions;
	try {
		dimensions = {
			offsetWidth: element.offsetWidth,
			offsetHeight: element.offsetHeight,
			scrollWidth: element.scrollWidth,
			scrollHeight: element.scrollHeight,
		};
	} finally {
		restoreStyles.forEach( ( restore ) => restore() );
	}
	return dimensions;
}

/**
 * Expands an item's column span, preferring a collision-free placement that
 * stays as close as possible to its current position.
 *
 * @param childId     Grid item's client ID.
 * @param rect        Grid item's current rectangle.
 * @param neededSpan  Minimum column span needed by the item.
 * @param columnCount Number of columns in the grid.
 * @param rects       Rectangles occupied by grid items, keyed by client ID.
 *
 * @return Expanded grid item rectangle.
 */
function getExpandedColumnRect(
	childId: string,
	rect: GridRect,
	neededSpan: number,
	columnCount: number,
	rects: ReadonlyMap< string, GridRect >
): GridRect {
	const columnSpan = Math.min(
		Math.max( rect.columnSpan, neededSpan ),
		columnCount
	);
	const maxGridStart = columnCount - columnSpan + 1;
	const preferredStart = Math.max(
		1,
		Math.min( rect.columnStart, maxGridStart )
	);
	const minStart = Math.max( 1, rect.columnEnd - columnSpan + 1 );
	const preferredRect = new GridRect( {
		columnStart: preferredStart,
		rowStart: rect.rowStart,
		columnSpan,
		rowSpan: rect.rowSpan,
	} );
	// With no alternative placement, checking other items cannot change the result.
	if ( preferredStart <= minStart ) {
		return preferredRect;
	}

	for (
		let columnStart = preferredStart;
		columnStart >= minStart;
		columnStart--
	) {
		const candidate = new GridRect( {
			columnStart,
			rowStart: rect.rowStart,
			columnSpan,
			rowSpan: rect.rowSpan,
		} );
		let intersectsOtherItem = false;
		for ( const [ otherId, otherRect ] of rects ) {
			if (
				otherId !== childId &&
				otherRect.intersectsRect( candidate )
			) {
				intersectsOtherItem = true;
				break;
			}
		}
		if ( ! intersectsOtherItem ) {
			return candidate;
		}
	}

	// If every placement overlaps another item, keep the item as close as
	// possible to its current position while ensuring it remains in the grid.
	return preferredRect;
}

/**
 * In a manual grid, adjusts column and row spans to fit each item's content,
 * while retaining any extra spans added by the user. Automatically added
 * spans may overlap other items. Column spans are capped at the column count
 * and may shift left to stay within the grid, while growing past the last row
 * adds rows.
 *
 * @param options
 * @param options.clientId The grid block's client ID.
 */
export function useGridAutoSpan( { clientId }: { clientId: string } ) {
	const isManualPlacement = useSelect(
		( select ) =>
			!! (
				select( blockEditorStore ).getBlockAttributes( clientId ) as {
					layout?: Layout;
				} | null
			 )?.layout?.isManualPlacement,
		[ clientId ]
	);
	const gridElement = useBlockElement( clientId );
	const childBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks( clientId ),
		[ clientId ]
	);
	const { getBlockAttributes, getBlockName, getBlockOrder } =
		useSelect( blockEditorStore );
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const refreshRef = useRef< ( () => void ) | undefined >( undefined );

	useEffect( () => {
		let autoSpanState = autoSpanStates.get( clientId );
		if ( ! autoSpanState ) {
			autoSpanState = { items: new Map() };
			autoSpanStates.set( clientId, autoSpanState );
		}
		if ( ! isManualPlacement || ! gridElement ) {
			if ( ! isManualPlacement ) {
				autoSpanStates.delete( clientId );
			}
			return;
		}
		const view = gridElement.ownerDocument.defaultView;
		if ( ! view ) {
			return;
		}

		/**
		 * Returns the grid's direct block element children.
		 *
		 * @return Grid item elements.
		 */
		const getItemElements = () =>
			Array.from( gridElement.children ).filter(
				( child ): child is HTMLElement =>
					child instanceof view.HTMLElement &&
					child.hasAttribute( 'data-block' )
			);
		// Capture item dimensions in the resize callback. Responsive child UI can
		// adapt before the scheduled check and otherwise hide the overflow that
		// caused the resize.
		const resizeDimensions = new Map<
			string,
			Pick< GridItemDimensions, 'scrollWidth' | 'scrollHeight' > & {
				attributes: GridItemAttributes | undefined;
			}
		>();

		/**
		 * Adjusts automatic spans to the current content and grid size.
		 *
		 * @param allowShrink Whether content changed since the previous check.
		 *
		 * @return Whether another check is needed after a span change.
		 */
		const adjustItemSpans = ( allowShrink: boolean ) => {
			const { rowCount: rawRowCount } =
				( getBlockAttributes( clientId ) as { layout?: Layout } | null )
					?.layout ?? {};
			if ( ! isPositiveInteger( rawRowCount ) ) {
				return false;
			}
			const rowCount = rawRowCount;
			const computedStyle = view.getComputedStyle( gridElement );
			// Grid tracks occupy the content box, while client dimensions include
			// padding. Remove it when tracking changes to the grid width.
			const gridWidth =
				gridElement.clientWidth -
				getCSSPixelValue( computedStyle.paddingLeft ) -
				getCSSPixelValue( computedStyle.paddingRight );
			if ( gridWidth <= 0 ) {
				return false;
			}
			const rowGap = getCSSPixelValue( computedStyle.rowGap );
			const columnGap = getCSSPixelValue( computedStyle.columnGap );
			// Responsive styles can change the number and size of tracks without
			// changing the layout attributes.
			const gridRowTracks = getGridTracks(
				computedStyle.gridTemplateRows,
				rowGap
			);
			const gridColumnTracks = getGridTracks(
				computedStyle.gridTemplateColumns,
				columnGap
			);
			const rowHeight = gridRowTracks[ 0 ].end - gridRowTracks[ 0 ].start;
			const columnWidth =
				gridColumnTracks[ 0 ].end - gridColumnTracks[ 0 ].start;
			if (
				! Number.isFinite( rowHeight ) ||
				! Number.isFinite( columnWidth ) ||
				rowHeight <= 0 ||
				columnWidth <= 0
			) {
				return false;
			}
			const columnCount = gridColumnTracks.length;
			const rowPitch = rowHeight + rowGap;
			const columnPitch = columnWidth + columnGap;

			const rects = new Map< string, GridRect >();
			const itemLayouts = new Map< string, GridItemAttributes >();
			for ( const childId of getBlockOrder( clientId ) ) {
				const attributes = getBlockAttributes(
					childId
				) as GridItemAttributes;
				const placement = getGridItemPlacement(
					attributes?.style?.layout
				);
				if (
					isPositiveInteger( placement.columnStart ) &&
					isPositiveInteger( placement.rowStart )
				) {
					if ( ! isPositiveInteger( placement.columnSpan ) ) {
						placement.columnSpan = 1;
					}
					if ( ! isPositiveInteger( placement.rowSpan ) ) {
						placement.rowSpan = 1;
					}
					rects.set( childId, new GridRect( placement ) );
					itemLayouts.set( childId, attributes );
				}
			}
			for ( const childId of autoSpanState.items.keys() ) {
				if ( ! rects.has( childId ) ) {
					autoSpanState.items.delete( childId );
				}
			}

			let autoSpanRows = autoSpanState.rows;
			if ( ! autoSpanRows || autoSpanRows.applied !== rowCount ) {
				autoSpanRows = {
					base: rowCount,
					applied: rowCount,
				};
				autoSpanState.rows = autoSpanRows;
			}

			const updates: Record< string, Record< string, unknown > > = {};
			let needsFollowUpCheck = false;
			for ( const element of getItemElements() ) {
				const childId = element.getAttribute( 'data-block' );
				if ( ! childId ) {
					continue;
				}
				const rect = rects.get( childId );
				const attributes = itemLayouts.get( childId );
				if ( ! rect || ! attributes ) {
					continue;
				}
				const itemLayout = attributes.style?.layout ?? {};
				let itemState = autoSpanState.items.get( childId );
				let renderedAttributesChanged = false;
				if ( itemState && itemState.attributes !== attributes ) {
					const blockName = getBlockName( childId );
					const contentAttributeKeys = blockName
						? getBlockAttributesNamesByRole( blockName, 'content' )
						: [];
					renderedAttributesChanged =
						! areContentAttributesEqual(
							itemState.attributes,
							attributes,
							contentAttributeKeys
						) ||
						! areUserControlledAttributesEqual(
							itemState.attributes,
							attributes,
							contentAttributeKeys
						);
				}
				const canShrink = allowShrink || renderedAttributesChanged;
				let columnSpanChanged = false;
				let rowSpanChanged = false;
				if (
					itemState &&
					! areGridRectsEqual( rect, itemState.appliedRect )
				) {
					columnSpanChanged =
						rect.columnSpan !== itemState.appliedRect.columnSpan;
					rowSpanChanged =
						rect.rowSpan !== itemState.appliedRect.rowSpan;
					itemState.userColumnStart = rect.columnStart;
					itemState.userRowStart = rect.rowStart;
					if ( columnSpanChanged ) {
						itemState.columnSpanWasImplicit = ! isPositiveInteger(
							itemLayout.columnSpan
						);
					}
					if ( rowSpanChanged ) {
						itemState.rowSpanWasImplicit = ! isPositiveInteger(
							itemLayout.rowSpan
						);
					}
				}

				const userColumnStart =
					itemState?.userColumnStart ?? rect.columnStart;
				const userRowStart = itemState?.userRowStart ?? rect.rowStart;
				const oneCellRect = new GridRect( {
					columnStart: userColumnStart,
					rowStart: userRowStart,
					columnSpan: 1,
					rowSpan: 1,
				} );
				const oneCellDimensions = measureElementAtRect(
					element,
					oneCellRect,
					rowHeight
				);
				const capturedDimensions = resizeDimensions.get( childId );
				// An edit may have invalidated an earlier resize notification.
				const dimensionsBeforeResponsiveReflow =
					capturedDimensions?.attributes === attributes
						? capturedDimensions
						: undefined;
				resizeDimensions.delete( childId );
				// Allow for sub-pixel rounding.
				const contentWidth = Math.max(
					oneCellDimensions.offsetWidth,
					oneCellDimensions.scrollWidth,
					rect.columnSpan === 1
						? ( dimensionsBeforeResponsiveReflow?.scrollWidth ?? 0 )
						: 0
				);
				const measuredAutoColumnSpan = Math.min(
					columnCount,
					contentWidth > columnWidth + 1
						? Math.ceil(
								( contentWidth + columnGap ) / columnPitch
							)
						: 1
				);
				const gridWidthChanged =
					itemState &&
					Math.abs( itemState.gridWidth - gridWidth ) > 1;
				let hasUserColumnSpanOverride =
					itemState?.hasUserColumnSpanOverride ?? false;
				let hasUserRowSpanOverride =
					itemState?.hasUserRowSpanOverride ?? false;
				let preserveUserResize = itemState?.preserveUserResize ?? false;
				hasUserColumnSpanOverride ||= columnSpanChanged;
				hasUserRowSpanOverride ||= rowSpanChanged;
				preserveUserResize ||= columnSpanChanged || rowSpanChanged;
				if ( renderedAttributesChanged ) {
					hasUserColumnSpanOverride = false;
					hasUserRowSpanOverride = false;
					preserveUserResize = false;
				} else if ( allowShrink || gridWidthChanged ) {
					preserveUserResize = false;
				}
				const preserveColumnSpan =
					hasUserColumnSpanOverride || preserveUserResize;
				const preserveRowSpan =
					hasUserRowSpanOverride || preserveUserResize;
				// Responsive content can adapt after an item grows, making a
				// resize-only follow-up appear to fit in one cell. Keep the span
				// from that content until the content or grid width changes.
				const autoColumnSpan =
					itemState && ! canShrink && ! gridWidthChanged
						? Math.max(
								itemState.autoColumnSpan,
								measuredAutoColumnSpan
							)
						: measuredAutoColumnSpan;
				const extraColumnSpan = columnSpanChanged
					? Math.max( 0, rect.columnSpan - autoColumnSpan )
					: ( itemState?.extraColumnSpan ??
						Math.max( 0, rect.columnSpan - autoColumnSpan ) );
				const desiredColumnSpan = Math.min(
					columnCount,
					autoColumnSpan + extraColumnSpan
				);
				const desiredWidthRect = preserveColumnSpan
					? new GridRect( {
							columnStart: rect.columnStart,
							rowStart: userRowStart,
							columnSpan: rect.columnSpan,
							rowSpan: 1,
						} )
					: getExpandedColumnRect(
							childId,
							oneCellRect,
							desiredColumnSpan,
							columnCount,
							rects
						);

				// Measure height at the chosen width because widening can reduce the
				// height of wrapped content.
				const desiredWidthDimensions = areGridRectsEqual(
					oneCellRect,
					desiredWidthRect
				)
					? oneCellDimensions
					: measureElementAtRect(
							element,
							desiredWidthRect,
							rowHeight
						);
				const contentHeight = Math.max(
					desiredWidthDimensions.offsetHeight,
					desiredWidthDimensions.scrollHeight,
					rect.columnSpan === desiredWidthRect.columnSpan &&
						rect.rowSpan === 1
						? ( dimensionsBeforeResponsiveReflow?.scrollHeight ??
								0 )
						: 0
				);
				let measuredAutoRowSpan =
					contentHeight > rowHeight + 1
						? Math.ceil( ( contentHeight + rowGap ) / rowPitch )
						: 1;
				if ( measuredAutoRowSpan > 1 ) {
					const expandedDimensions = measureElementAtRect(
						element,
						new GridRect( {
							columnStart: desiredWidthRect.columnStart,
							rowStart: userRowStart,
							columnSpan: desiredWidthRect.columnSpan,
							rowSpan: measuredAutoRowSpan,
						} ),
						rowHeight
					);
					const expandedHeight = Math.max(
						expandedDimensions.offsetHeight,
						expandedDimensions.scrollHeight
					);
					const expandedOverflow =
						expandedHeight -
						( measuredAutoRowSpan * rowPitch - rowGap );
					// Percentage heights plus margins can overflow by the same
					// amount at every span. Grow only if extra space reduces the
					// overflow; otherwise each resize would request more rows.
					if (
						expandedOverflow > 1 &&
						expandedOverflow >= contentHeight - rowHeight - 1
					) {
						measuredAutoRowSpan = 1;
					}
				}
				const autoRowSpan =
					itemState &&
					! canShrink &&
					! gridWidthChanged &&
					desiredWidthRect.columnSpan ===
						itemState.appliedRect.columnSpan
						? Math.max( itemState.autoRowSpan, measuredAutoRowSpan )
						: measuredAutoRowSpan;
				const extraRowSpan = rowSpanChanged
					? Math.max( 0, rect.rowSpan - autoRowSpan )
					: ( itemState?.extraRowSpan ??
						Math.max( 0, rect.rowSpan - autoRowSpan ) );
				const desiredRect = new GridRect( {
					columnStart: desiredWidthRect.columnStart,
					rowStart: userRowStart,
					columnSpan: desiredWidthRect.columnSpan,
					rowSpan: preserveRowSpan
						? rect.rowSpan
						: autoRowSpan + extraRowSpan,
				} );

				if ( ! itemState ) {
					itemState = {
						appliedRect: rect,
						attributes,
						userColumnStart,
						userRowStart,
						extraColumnSpan,
						extraRowSpan,
						autoColumnSpan,
						autoRowSpan,
						gridWidth,
						hasUserColumnSpanOverride,
						hasUserRowSpanOverride,
						preserveUserResize,
						columnSpanWasImplicit: ! isPositiveInteger(
							itemLayout.columnSpan
						),
						rowSpanWasImplicit: ! isPositiveInteger(
							itemLayout.rowSpan
						),
					};
					autoSpanState.items.set( childId, itemState );
				} else {
					itemState.attributes = attributes;
					itemState.extraColumnSpan = extraColumnSpan;
					itemState.extraRowSpan = extraRowSpan;
					itemState.autoColumnSpan = autoColumnSpan;
					itemState.autoRowSpan = autoRowSpan;
					itemState.gridWidth = gridWidth;
					itemState.hasUserColumnSpanOverride =
						hasUserColumnSpanOverride;
					itemState.hasUserRowSpanOverride = hasUserRowSpanOverride;
					itemState.preserveUserResize = preserveUserResize;
				}
				if ( areGridRectsEqual( desiredRect, rect ) ) {
					itemState.appliedRect = rect;
					continue;
				}
				rects.set( childId, desiredRect );
				itemState.appliedRect = desiredRect;
				needsFollowUpCheck = true;
				updates[ childId ] = {
					style: {
						...attributes.style,
						layout: {
							...attributes.style?.layout,
							columnStart: desiredRect.columnStart,
							columnSpan:
								desiredRect.columnSpan === 1 &&
								itemState.columnSpanWasImplicit
									? undefined
									: desiredRect.columnSpan,
							rowSpan:
								desiredRect.rowSpan === 1 &&
								itemState.rowSpanWasImplicit
									? undefined
									: desiredRect.rowSpan,
						},
					},
				};
			}

			// Growing past the last row adds rows. Shrinking back removes only
			// rows that were added automatically. Row height stays the same
			// because the grid's aspect ratio scales with the row count.
			const desiredRowCount = getRequiredGridRowCount(
				rects.values(),
				autoSpanRows.base
			);
			if ( desiredRowCount !== rowCount ) {
				const gridLayout = (
					getBlockAttributes( clientId ) as { layout?: Layout }
				 ).layout;
				updates[ clientId ] = {
					layout: { ...gridLayout, rowCount: desiredRowCount },
				};
				autoSpanRows.applied = desiredRowCount;
				needsFollowUpCheck = true;
			}

			const updatedIds = Object.keys( updates );
			if ( updatedIds.length ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes(
					updatedIds,
					updates,
					/* uniqueByBlock: */ true
				);
			}
			return needsFollowUpCheck;
		};

		let frame: number | undefined;
		/**
		 * Schedules one overflow check for the next animation frame.
		 */
		let shouldAllowShrink = false;
		const scheduleCheck = ( allowShrink = false ) => {
			shouldAllowShrink ||= allowShrink;
			if ( frame === undefined ) {
				frame = view.requestAnimationFrame( () => {
					frame = undefined;
					const allowScheduledShrink = shouldAllowShrink;
					shouldAllowShrink = false;
					if ( adjustItemSpans( allowScheduledShrink ) ) {
						scheduleCheck();
					}
				} );
			}
		};

		// Text edits don't resize a stretched item, so watch the content too.
		const mutationObserver = new view.MutationObserver( () =>
			scheduleCheck( true )
		);
		mutationObserver.observe( gridElement, {
			childList: true,
			characterData: true,
			subtree: true,
		} );
		// Replaced images can finish loading after their content attributes have
		// already been measured. Remeasure once their intrinsic size is available.
		const handleImageLoad = ( event: Event ) => {
			if ( event.target instanceof view.HTMLImageElement ) {
				scheduleCheck( true );
			}
		};
		gridElement.addEventListener( 'load', handleImageLoad, true );
		const resizeObserver = new view.ResizeObserver( ( entries ) => {
			for ( const { target } of entries ) {
				if (
					! ( target instanceof view.HTMLElement ) ||
					target.parentElement !== gridElement
				) {
					continue;
				}
				const childId = target.getAttribute( 'data-block' );
				if ( childId ) {
					resizeDimensions.set( childId, {
						attributes: getBlockAttributes( childId ) as
							GridItemAttributes | undefined,
						scrollWidth: target.scrollWidth,
						scrollHeight: target.scrollHeight,
					} );
				}
			}
			scheduleCheck();
		} );
		resizeObserver.observe( gridElement );
		const observedItems = new Set< HTMLElement >();
		const refresh = () => {
			const itemElements = new Set( getItemElements() );
			for ( const element of observedItems ) {
				if ( ! itemElements.has( element ) ) {
					resizeObserver.unobserve( element );
					observedItems.delete( element );
					const childId = element.getAttribute( 'data-block' );
					if ( childId ) {
						resizeDimensions.delete( childId );
					}
				}
			}
			for ( const element of itemElements ) {
				if ( ! observedItems.has( element ) ) {
					resizeObserver.observe( element );
					observedItems.add( element );
				}
			}
			scheduleCheck();
		};
		refreshRef.current = refresh;
		refresh();

		return () => {
			refreshRef.current = undefined;
			mutationObserver.disconnect();
			resizeObserver.disconnect();
			gridElement.removeEventListener( 'load', handleImageLoad, true );
			if ( frame !== undefined ) {
				view.cancelAnimationFrame( frame );
			}
		};
	}, [
		clientId,
		gridElement,
		isManualPlacement,
		getBlockAttributes,
		getBlockName,
		getBlockOrder,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	// Content and placement edits need another check, but keep observers and any
	// captured overflow dimensions alive across those edits.
	useEffect( () => {
		refreshRef.current?.();
	}, [ childBlocks ] );
}
