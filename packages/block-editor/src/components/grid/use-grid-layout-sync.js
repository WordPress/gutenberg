import { hasBlockSupport } from '@wordpress/blocks';
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
import { copyChildLayout } from './child-layout';
import { setImmutably } from '../../utils/object';

export function useGridLayoutSync( { clientId: gridClientId } ) {
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
					gridLayout: getBlockAttributes( gridClientId ).layout ?? {},
					blockOrder: getBlockOrder( gridClientId ),
					selectedClientId: _selectedClientId,
					selectedBlockStyle: _selectedClientId
						? getBlockAttributes( _selectedClientId )?.style
						: undefined,
				};
			},
			[ gridClientId ]
		);

	const {
		getBlockAttributes,
		getBlockName,
		getBlockRootClientId,
		wasBlockJustInsertedFromInserter,
	} = unlock( useSelect( blockEditorStore ) );
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
		const updates = {};

		if ( gridLayout.isManualPlacement ) {
			const occupiedRects = [];

			// Respect the position of blocks that already have a columnStart and rowStart value.
			for ( const clientId of blockOrder ) {
				const {
					columnStart,
					rowStart,
					columnSpan = 1,
					rowSpan = 1,
				} = getBlockAttributes( clientId ).style?.layout ?? {};
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
					getBlockAttributes( clientId ).style?.layout ?? {};
				return ! columnStart || ! rowStart;
			} );
			if ( unplacedClientIds.length ) {
				const { columnTracks, rowTracks } = gridElement
					? getGridTrackPositions( gridElement )
					: {};
				const columnCount =
					gridLayout.columnCount || columnTracks?.length || 1;
				const rowCount = gridLayout.rowCount || rowTracks?.length || 1;
				const size = getInsertionSize( { columnTracks, rowTracks } );

				// The block that was selected, if it is in the grid, is where
				// a block added next to it, such as by pressing Enter, goes.
				const previousIndex =
					previousBlockOrder?.indexOf(
						previousSelection?.clientId
					) ?? -1;
				const previousLayout = previousSelection?.style?.layout;
				let reference =
					blockOrder.includes( previousSelection?.clientId ) &&
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
					previousIndex !== -1 &&
					! blockOrder.includes( previousSelection.clientId ) &&
					getBlockRootClientId( previousSelection.clientId ) === null
						? previousSelection.style
						: undefined;

				for ( const clientId of unplacedClientIds ) {
					const attributes = getBlockAttributes( clientId );
					const index = blockOrder.indexOf( clientId );

					if (
						replacedStyle?.layout?.columnStart &&
						replacedStyle?.layout?.rowStart &&
						index === previousIndex
					) {
						let style = copyChildLayout(
							attributes.style,
							replacedStyle
						);
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

					const layout = attributes.style?.layout ?? {};
					// Blocks already in the grid, such as when it switches to
					// manual placement, are placed in order, at their size.
					// Blocks new to it are big enough for a placeholder.
					const isNew =
						!! previousBlockOrder &&
						! previousBlockOrder.includes( clientId );
					let placement = 'first-free';
					if (
						isNew &&
						wasBlockJustInsertedFromInserter( clientId )
					) {
						placement = 'center';
					} else if ( isNew && reference ) {
						const referenceIndex = blockOrder.indexOf(
							previousSelection.clientId
						);
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

			// An aligned block gets a wrapper in the editor that becomes the
			// grid item and ignores the block's place, so blocks lose their
			// alignment when they enter a manual grid, as part of the grid
			// interactivity experiment. It isn't restored if they leave.
			if ( window.__experimentalEnableGridInteractivity ) {
				for ( const clientId of blockOrder ) {
					if (
						getBlockAttributes( clientId ).align &&
						hasBlockSupport( getBlockName( clientId ), 'align' )
					) {
						updates[ clientId ] = {
							...updates[ clientId ],
							align: undefined,
						};
					}
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
					const rootAttributes = getBlockAttributes( rootClientId );
					if ( rootAttributes?.layout?.type === 'grid' ) {
						continue;
					}

					const attributes = getBlockAttributes( clientId );
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

						updates[ clientId ] = setImmutably(
							attributes,
							[ 'style', 'layout' ],
							hasEmptyLayoutAttribute ? undefined : layout
						);
					}
				}
			}
		} else {
			// Remove all of the columnStart and rowStart values
			// when switching from manual to auto mode,
			if ( previousIsManualPlacement === true ) {
				for ( const clientId of blockOrder ) {
					const attributes = getBlockAttributes( clientId );
					const { columnStart, rowStart, ...layout } =
						attributes.style?.layout ?? {};
					// Only update attributes if columnStart or rowStart are set.
					if ( columnStart || rowStart ) {
						const hasEmptyLayoutAttribute =
							Object.keys( layout ).length === 0;

						updates[ clientId ] = setImmutably(
							attributes,
							[ 'style', 'layout' ],
							hasEmptyLayoutAttribute ? undefined : layout
						);
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
		getBlockName,
		getBlockRootClientId,
		wasBlockJustInsertedFromInserter,
		updateBlockAttributes,
	] );
}
