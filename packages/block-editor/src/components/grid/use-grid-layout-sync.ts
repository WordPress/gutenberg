import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { GridRect, getGridTrackPositions } from './utils';
import {
	getInsertedBlockRect,
	getInsertionSize,
} from './get-inserted-block-rect';
import type { InsertionPlacement } from './get-inserted-block-rect';
import { copyChildLayout } from './child-layout';
import { setImmutably } from '../../utils/object';
import type { Layout } from '../../layouts/types';
import type { GridItemAttributes, GridItemLayout, GridTrack } from './types';

export function useGridLayoutSync( {
	clientId: gridClientId,
}: {
	clientId: string;
} ) {
	const { gridLayout, blockOrder, selectedClientId, selectedBlockStyle } =
		useSelect(
			( select ) => {
				const {
					getBlockAttributes,
					getBlockOrder,
					getSelectedBlockClientId,
				} = select( blockEditorStore );
				const _selectedClientId = getSelectedBlockClientId();
				return {
					// The grid block exists, with its layout attribute.
					gridLayout: ( (
						getBlockAttributes( gridClientId ) as {
							layout?: Layout;
						}
					 ).layout ?? {} ) as Layout,
					blockOrder: getBlockOrder( gridClientId ),
					selectedClientId: _selectedClientId,
					// A selected grid item positions itself through its style.
					selectedBlockStyle: _selectedClientId
						? (
								getBlockAttributes( _selectedClientId ) as
									GridItemAttributes | undefined
							 )?.style
						: undefined,
				};
			},
			[ gridClientId ]
		);

	const { getBlockAttributes, getBlockRootClientId } =
		useSelect( blockEditorStore );
	const { wasBlockJustInsertedFromInserter } = unlock(
		useSelect( blockEditorStore )
	);
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const gridElement = useBlockElement( gridClientId );

	const selection = useMemo(
		() => ( { clientId: selectedClientId, style: selectedBlockStyle } ),
		[ selectedClientId, selectedBlockStyle ]
	);
	const previousSelection = usePrevious( selection );
	const previousIsManualPlacement = usePrevious(
		gridLayout.isManualPlacement
	);
	const previousBlockOrder = usePrevious( blockOrder );

	useEffect( () => {
		const updates: Record< string, Record< string, unknown > > = {};

		if ( gridLayout.isManualPlacement ) {
			const occupiedRects: GridRect[] = [];

			// Respect the position of blocks that already have a columnStart and rowStart value.
			for ( const clientId of blockOrder ) {
				const {
					columnStart,
					rowStart,
					columnSpan = 1,
					rowSpan = 1,
				} = ( getBlockAttributes( clientId ) as GridItemAttributes )
					.style?.layout ?? {};
				if ( ! columnStart || ! rowStart ) {
					continue;
				}
				occupiedRects.push(
					new GridRect( {
						columnStart,
						rowStart,
						columnSpan,
						rowSpan,
					} )
				);
			}

			// When in manual mode, ensure that every block has a columnStart and rowStart value.
			const unplacedClientIds = blockOrder.filter( ( clientId ) => {
				const { columnStart, rowStart } =
					( getBlockAttributes( clientId ) as GridItemAttributes )
						.style?.layout ?? {};
				return ! columnStart || ! rowStart;
			} );
			if ( unplacedClientIds.length ) {
				const {
					columnTracks,
					rowTracks,
				}: { columnTracks?: GridTrack[]; rowTracks?: GridTrack[] } =
					gridElement ? getGridTrackPositions( gridElement ) : {};
				const columnCount =
					gridLayout.columnCount || columnTracks?.length || 1;
				const rowCount = gridLayout.rowCount || rowTracks?.length || 1;
				const size = getInsertionSize( { columnTracks, rowTracks } );

				// The block that was selected, if it is in the grid, is where
				// a block added next to it, such as by pressing Enter, goes.
				const previousClientId = previousSelection?.clientId;
				const previousIndex = previousClientId
					? ( previousBlockOrder?.indexOf( previousClientId ) ?? -1 )
					: -1;
				const previousLayout = previousSelection?.style?.layout;
				let reference =
					previousClientId &&
					blockOrder.includes( previousClientId ) &&
					previousLayout?.columnStart &&
					previousLayout?.rowStart
						? new GridRect( {
								columnStart: previousLayout.columnStart,
								rowStart: previousLayout.rowStart,
								columnSpan: previousLayout.columnSpan ?? 1,
								rowSpan: previousLayout.rowSpan ?? 1,
							} )
						: null;
				// A block that replaced the selected block, such as one picked
				// in an inserter to replace an empty paragraph, takes its place.
				const replacedStyle =
					previousClientId &&
					previousIndex !== -1 &&
					! blockOrder.includes( previousClientId ) &&
					getBlockRootClientId( previousClientId ) === null
						? previousSelection?.style
						: undefined;

				for ( const clientId of unplacedClientIds ) {
					// The grid items exist.
					const attributes = getBlockAttributes(
						clientId
					) as GridItemAttributes;
					const index = blockOrder.indexOf( clientId );

					if (
						replacedStyle?.layout?.columnStart &&
						replacedStyle?.layout?.rowStart &&
						index === previousIndex
					) {
						// The replaced block's layout has a place, so the
						// copied style has a layout.
						let style = copyChildLayout(
							attributes.style,
							replacedStyle
						) as {
							layout: GridItemLayout;
							[ key: string ]: unknown;
						};
						// A layout of its own without a place gets the place.
						if (
							! style.layout.columnStart ||
							! style.layout.rowStart
						) {
							style = {
								...style,
								layout: {
									...replacedStyle.layout,
									...style.layout,
									columnStart:
										replacedStyle.layout.columnStart,
									rowStart: replacedStyle.layout.rowStart,
								},
							};
						}
						const { columnStart, rowStart, columnSpan, rowSpan } =
							style.layout;
						const rect = new GridRect( {
							columnStart,
							rowStart,
							columnSpan: columnSpan ?? 1,
							rowSpan: rowSpan ?? 1,
						} );
						occupiedRects.push( rect );
						updates[ clientId ] = { style };
						reference = rect;
						continue;
					}

					const layout: GridItemLayout =
						attributes.style?.layout ?? {};
					// Blocks already in the grid, such as when it switches to
					// manual placement, are placed in order, at their size.
					// Blocks new to it are big enough for a placeholder.
					const isNew =
						!! previousBlockOrder &&
						! previousBlockOrder.includes( clientId );
					let placement: InsertionPlacement = 'first-free';
					if (
						isNew &&
						wasBlockJustInsertedFromInserter( clientId )
					) {
						placement = 'center';
					} else if ( isNew && reference ) {
						const referenceIndex = previousClientId
							? blockOrder.indexOf( previousClientId )
							: -1;
						placement =
							referenceIndex !== -1 && index < referenceIndex
								? 'before'
								: 'after';
					}
					const defaultSize = isNew
						? size
						: { columnSpan: 1, rowSpan: 1 };
					const rect = getInsertedBlockRect( {
						placement,
						size: {
							columnSpan: Math.min(
								layout.columnSpan ?? defaultSize.columnSpan,
								columnCount
							),
							rowSpan: layout.rowSpan ?? defaultSize.rowSpan,
						},
						columnCount,
						rowCount,
						occupiedRects,
						reference,
					} );
					occupiedRects.push( rect );
					// The blocks inserted together go one after the other.
					if ( isNew && placement !== 'center' ) {
						reference = rect;
					}
					updates[ clientId ] = {
						style: {
							...attributes.style,
							layout: {
								...layout,
								columnStart: rect.columnStart,
								rowStart: rect.rowStart,
								columnSpan:
									rect.columnSpan > 1
										? rect.columnSpan
										: undefined,
								rowSpan:
									rect.rowSpan > 1 ? rect.rowSpan : undefined,
							},
						},
					};
				}
			}

			// Ensure there's enough rows to fit all blocks.
			const bottomMostRow = Math.max(
				...occupiedRects.map( ( r ) => r.rowEnd )
			);
			if (
				! gridLayout.rowCount ||
				gridLayout.rowCount < bottomMostRow
			) {
				updates[ gridClientId ] = {
					layout: {
						...gridLayout,
						rowCount: bottomMostRow,
					},
				};
			}

			// Unset grid layout attributes for blocks removed from the grid.
			for ( const clientId of previousBlockOrder ?? [] ) {
				if ( ! blockOrder.includes( clientId ) ) {
					const rootClientId = getBlockRootClientId( clientId );

					// Block was removed from the editor, so nothing to do.
					if ( rootClientId === null ) {
						continue;
					}

					// Check if the block is being moved to another grid.
					// If so, do nothing and let the new grid parent handle
					// the attributes.
					const rootAttributes = getBlockAttributes(
						rootClientId
					) as {
						layout?: Layout;
					} | null;
					if ( rootAttributes?.layout?.type === 'grid' ) {
						continue;
					}

					// A moved block exists.
					const attributes = getBlockAttributes(
						clientId
					) as GridItemAttributes;
					const {
						columnStart,
						rowStart,
						columnSpan,
						rowSpan,
						...layout
					} = attributes.style?.layout ?? {};

					if ( columnStart || rowStart || columnSpan || rowSpan ) {
						const hasEmptyLayoutAttribute =
							Object.keys( layout ).length === 0;

						// Setting a path in the attributes object keeps an object.
						updates[ clientId ] = setImmutably(
							attributes,
							[ 'style', 'layout' ],
							hasEmptyLayoutAttribute ? undefined : layout
						) as Record< string, unknown >;
					}
				}
			}
		} else {
			// Remove all of the columnStart and rowStart values
			// when switching from manual to auto mode,
			if ( previousIsManualPlacement === true ) {
				for ( const clientId of blockOrder ) {
					// The grid items exist.
					const attributes = getBlockAttributes(
						clientId
					) as GridItemAttributes;
					const { columnStart, rowStart, ...layout } =
						attributes.style?.layout ?? {};
					// Only update attributes if columnStart or rowStart are set.
					if ( columnStart || rowStart ) {
						const hasEmptyLayoutAttribute =
							Object.keys( layout ).length === 0;

						// Setting a path in the attributes object keeps an object.
						updates[ clientId ] = setImmutably(
							attributes,
							[ 'style', 'layout' ],
							hasEmptyLayoutAttribute ? undefined : layout
						) as Record< string, unknown >;
					}
				}
			}

			// Remove row styles in auto mode
			if ( gridLayout.rowCount ) {
				updates[ gridClientId ] = {
					layout: {
						...gridLayout,
						rowCount: undefined,
					},
				};
			}
		}

		if ( Object.keys( updates ).length ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes(
				Object.keys( updates ),
				updates,
				/* uniqueByBlock: */ true
			);
		}
	}, [
		// Actual deps to sync:
		gridClientId,
		gridLayout,
		previousBlockOrder,
		blockOrder,
		previousSelection,
		previousIsManualPlacement,
		gridElement,
		// These won't change, but the linter thinks they might:
		__unstableMarkNextChangeAsNotPersistent,
		getBlockAttributes,
		getBlockRootClientId,
		wasBlockJustInsertedFromInserter,
		updateBlockAttributes,
	] );
}
