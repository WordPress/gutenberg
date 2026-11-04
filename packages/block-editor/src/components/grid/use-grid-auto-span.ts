import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '../../store';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { GridRect, getComputedCSS } from './utils';
import type { Layout } from '../../layouts/types';
import type { GridItemAttributes } from './types';

function isPositiveInteger( value: unknown ): value is number {
	return typeof value === 'number' && Number.isInteger( value ) && value > 0;
}

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
 * In a manual grid, grows the column and row spans of items whose content
 * overflows their grid area, so that rows can stay square. Spans only ever
 * grow, and may overlap other items. Column spans are capped at the column
 * count and may shift left to stay within the grid, while growing past the
 * last row adds rows.
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
	const { getBlockAttributes, getBlockOrder } = useSelect( blockEditorStore );
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	useEffect( () => {
		if ( ! isManualPlacement || ! gridElement ) {
			return;
		}
		const view = gridElement.ownerDocument.defaultView;
		if ( ! view ) {
			return;
		}

		const getItemElements = () =>
			Array.from( gridElement.children ).filter(
				( child ): child is HTMLElement =>
					child instanceof view.HTMLElement &&
					child.hasAttribute( 'data-block' )
			);

		const growOverflowingItems = () => {
			const { rowCount: rawRowCount, columnCount: rawColumnCount } =
				( getBlockAttributes( clientId ) as { layout?: Layout } | null )
					?.layout ?? {};
			const gridHeight = gridElement.clientHeight;
			const gridWidth = gridElement.clientWidth;
			if (
				! isPositiveInteger( rawRowCount ) ||
				! isPositiveInteger( rawColumnCount ) ||
				! gridHeight ||
				! gridWidth
			) {
				return;
			}
			const rowCount = rawRowCount;
			const columnCount = rawColumnCount;
			const rowGap =
				parseFloat( getComputedCSS( gridElement, 'row-gap' ) ) || 0;
			const columnGap =
				parseFloat( getComputedCSS( gridElement, 'column-gap' ) ) || 0;
			const rowHeight =
				( gridHeight - rowGap * ( rowCount - 1 ) ) / rowCount;
			const columnWidth =
				( gridWidth - columnGap * ( columnCount - 1 ) ) / columnCount;
			if ( rowHeight <= 0 || columnWidth <= 0 ) {
				return;
			}
			const rowPitch = rowHeight + rowGap;
			const columnPitch = columnWidth + columnGap;

			const rects = new Map< string, GridRect >();
			for ( const childId of getBlockOrder( clientId ) ) {
				const { columnStart, rowStart, columnSpan, rowSpan } =
					( getBlockAttributes( childId ) as GridItemAttributes )
						?.style?.layout ?? {};
				if (
					isPositiveInteger( columnStart ) &&
					isPositiveInteger( rowStart )
				) {
					rects.set(
						childId,
						new GridRect( {
							columnStart,
							rowStart,
							columnSpan: isPositiveInteger( columnSpan )
								? columnSpan
								: 1,
							rowSpan: isPositiveInteger( rowSpan ) ? rowSpan : 1,
						} )
					);
				}
			}

			const updates: Record< string, Record< string, unknown > > = {};
			for ( const element of getItemElements() ) {
				const childId = element.getAttribute( 'data-block' )!;
				const rect = rects.get( childId );
				if ( ! rect ) {
					continue;
				}
				// Allow for sub-pixel rounding.
				const overflowsWidth =
					element.scrollWidth > element.clientWidth + 1;
				// A wider item may stop overflowing vertically, so wait for
				// the next check to measure its height.
				const overflowsHeight =
					! overflowsWidth &&
					element.scrollHeight > element.clientHeight + 1;
				let { columnStart, columnSpan, rowSpan } = rect;
				if ( overflowsWidth ) {
					const neededSpan = Math.ceil(
						( element.scrollWidth + columnGap ) / columnPitch
					);
					const expandedRect = getExpandedColumnRect(
						childId,
						rect,
						neededSpan,
						columnCount,
						rects
					);
					columnStart = expandedRect.columnStart;
					columnSpan = expandedRect.columnSpan;
				} else if ( overflowsHeight ) {
					const neededSpan = Math.ceil(
						( element.scrollHeight + rowGap ) / rowPitch
					);
					rowSpan = Math.max( rowSpan, neededSpan );
				}
				if (
					columnStart === rect.columnStart &&
					columnSpan === rect.columnSpan &&
					rowSpan === rect.rowSpan
				) {
					continue;
				}
				rects.set(
					childId,
					new GridRect( {
						columnStart,
						rowStart: rect.rowStart,
						columnSpan,
						rowSpan,
					} )
				);
				const attributes = getBlockAttributes(
					childId
				) as GridItemAttributes;
				updates[ childId ] = {
					style: {
						...attributes.style,
						layout: {
							...attributes.style?.layout,
							columnStart,
							columnSpan,
							rowSpan,
						},
					},
				};
			}

			// Growing past the last row adds rows. Row height stays the same
			// because the grid's aspect ratio scales with the row count.
			const bottomMostRow = Math.max(
				...[ ...rects.values() ].map( ( r ) => r.rowEnd )
			);
			if ( Object.keys( updates ).length && bottomMostRow > rowCount ) {
				const gridLayout = (
					getBlockAttributes( clientId ) as { layout?: Layout }
				 ).layout;
				updates[ clientId ] = {
					layout: { ...gridLayout, rowCount: bottomMostRow },
				};
			}

			if ( Object.keys( updates ).length ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes(
					Object.keys( updates ),
					updates,
					/* uniqueByBlock: */ true
				);
			}
		};

		let frame: number | undefined;
		const scheduleCheck = () => {
			if ( frame === undefined ) {
				frame = view.requestAnimationFrame( () => {
					frame = undefined;
					growOverflowingItems();
				} );
			}
		};

		// Text edits don't resize a stretched item, so watch the content too.
		const mutationObserver = new view.MutationObserver( scheduleCheck );
		mutationObserver.observe( gridElement, {
			childList: true,
			characterData: true,
			subtree: true,
		} );
		const resizeObserver = new view.ResizeObserver( scheduleCheck );
		resizeObserver.observe( gridElement );
		getItemElements().forEach( ( element ) =>
			resizeObserver.observe( element )
		);
		scheduleCheck();

		return () => {
			mutationObserver.disconnect();
			resizeObserver.disconnect();
			if ( frame !== undefined ) {
				view.cancelAnimationFrame( frame );
			}
		};
	}, [
		clientId,
		gridElement,
		isManualPlacement,
		getBlockAttributes,
		getBlockOrder,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );
}
