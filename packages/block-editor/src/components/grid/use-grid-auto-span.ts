import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '../../store';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { GridRect, getComputedCSS } from './utils';
import type { Layout } from '../../layouts/types';
import type { GridItemAttributes } from './types';

/**
 * In a manual grid, grows the column and row spans of items whose content
 * overflows their grid area, so that rows can stay square. Spans only ever
 * grow, and may overlap other items. Column spans are capped at the column
 * count, while growing past the last row adds rows.
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
			const rowCount = Number( rawRowCount );
			const columnCount = Number( rawColumnCount );
			const gridHeight = gridElement.clientHeight;
			const gridWidth = gridElement.clientWidth;
			if ( ! rowCount || ! columnCount || ! gridHeight || ! gridWidth ) {
				return;
			}
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
				if ( columnStart && rowStart ) {
					rects.set(
						childId,
						new GridRect( {
							columnStart,
							rowStart,
							columnSpan: columnSpan ?? 1,
							rowSpan: rowSpan ?? 1,
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
				let { columnSpan, rowSpan } = rect;
				if ( overflowsWidth ) {
					const neededSpan = Math.ceil(
						( element.scrollWidth + columnGap ) / columnPitch
					);
					columnSpan = Math.min(
						Math.max( columnSpan, neededSpan ),
						columnCount - rect.columnStart + 1
					);
				} else if ( overflowsHeight ) {
					const neededSpan = Math.ceil(
						( element.scrollHeight + rowGap ) / rowPitch
					);
					rowSpan = Math.max( rowSpan, neededSpan );
				}
				if (
					columnSpan === rect.columnSpan &&
					rowSpan === rect.rowSpan
				) {
					continue;
				}
				rects.set(
					childId,
					new GridRect( {
						columnStart: rect.columnStart,
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
