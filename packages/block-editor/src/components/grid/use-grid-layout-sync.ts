import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { GridRect } from './utils';
import { setImmutably } from '../../utils/object';
import type { Layout } from '../../layouts/types';
import type { GridItemAttributes } from './types';

export function useGridLayoutSync( {
	clientId: gridClientId,
}: {
	clientId: string;
} ) {
	const { gridLayout, blockOrder, selectedBlockLayout } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockOrder } =
				select( blockEditorStore );
			const selectedBlock = select( blockEditorStore ).getSelectedBlock();
			return {
				// The grid block exists, with its layout attribute.
				gridLayout: ( (
					getBlockAttributes( gridClientId ) as {
						layout?: Layout;
					}
				 ).layout ?? {} ) as Layout,
				blockOrder: getBlockOrder( gridClientId ),
				// A selected grid item positions itself through its style.
				selectedBlockLayout: (
					selectedBlock?.attributes as GridItemAttributes | undefined
				 )?.style?.layout,
			};
		},
		[ gridClientId ]
	);

	const { getBlockAttributes, getBlockRootClientId } =
		useSelect( blockEditorStore );
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const selectedBlockRect = useMemo(
		() =>
			selectedBlockLayout ? new GridRect( selectedBlockLayout ) : null,
		[ selectedBlockLayout ]
	);

	const previouslySelectedBlockRect = usePrevious( selectedBlockRect );
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
			for ( const clientId of blockOrder ) {
				// The grid items exist.
				const attributes = getBlockAttributes(
					clientId
				) as GridItemAttributes;
				const {
					columnStart,
					rowStart,
					columnSpan = 1,
					rowSpan = 1,
				} = attributes.style?.layout ?? {};
				if ( columnStart && rowStart ) {
					continue;
				}
				const [ newColumnStart, newRowStart ] = placeBlock(
					occupiedRects,
					// A manual grid has a column count.
					gridLayout.columnCount!,
					columnSpan,
					rowSpan,
					previouslySelectedBlockRect?.columnEnd,
					previouslySelectedBlockRect?.rowEnd
				);
				occupiedRects.push(
					new GridRect( {
						columnStart: newColumnStart,
						rowStart: newRowStart,
						columnSpan,
						rowSpan,
					} )
				);
				updates[ clientId ] = {
					style: {
						...attributes.style,
						layout: {
							...attributes.style?.layout,
							columnStart: newColumnStart,
							rowStart: newRowStart,
						},
					},
				};
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
		previouslySelectedBlockRect,
		previousIsManualPlacement,
		// These won't change, but the linter thinks they might:
		__unstableMarkNextChangeAsNotPersistent,
		getBlockAttributes,
		getBlockRootClientId,
		updateBlockAttributes,
	] );
}

/**
 * @param occupiedRects
 * @param gridColumnCount
 * @param blockColumnSpan
 * @param blockRowSpan
 * @param startColumn
 * @param startRow
 */
function placeBlock(
	occupiedRects: GridRect[],
	gridColumnCount: number,
	blockColumnSpan: number,
	blockRowSpan: number,
	startColumn: number = 1,
	startRow: number = 1
): [ number, number ] {
	for ( let row = startRow; ; row++ ) {
		for (
			let column = row === startRow ? startColumn : 1;
			column <= gridColumnCount;
			column++
		) {
			const candidateRect = new GridRect( {
				columnStart: column,
				rowStart: row,
				columnSpan: blockColumnSpan,
				rowSpan: blockRowSpan,
			} );
			if (
				! occupiedRects.some( ( r ) =>
					r.intersectsRect( candidateRect )
				)
			) {
				return [ column, row ];
			}
		}
	}
}
