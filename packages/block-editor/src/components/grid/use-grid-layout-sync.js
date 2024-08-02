/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { GridRect } from './utils';

function unsetGridPositionAttributes( attributes ) {
	const { columnStart, rowStart, ...layout } = attributes.style?.layout ?? {};
	// Only update attributes if columnStart or rowStart are set.
	if ( columnStart || rowStart ) {
		return {
			style: {
				...attributes.style,
				layout,
			},
		};
	}
}

export function useGridLayoutSync( { clientId: gridClientId } ) {
	const { gridLayout, blockOrder, selectedBlockLayout } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockOrder } =
				select( blockEditorStore );
			const selectedBlock = select( blockEditorStore ).getSelectedBlock();
			return {
				gridLayout: getBlockAttributes( gridClientId ).layout ?? {},
				blockOrder: getBlockOrder( gridClientId ),
				selectedBlockLayout: selectedBlock?.attributes.style?.layout,
			};
		},
		[ gridClientId ]
	);

	const { getBlockAttributes } = useSelect( blockEditorStore );
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
			for ( const clientId of blockOrder ) {
				const attributes = getBlockAttributes( clientId );
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
					gridLayout.columnCount,
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

			// Unset the columnStart/rowStart attributes for blocks removed
			// from the grid.
			previousBlockOrder?.forEach( ( clientId ) => {
				if ( ! blockOrder.includes( clientId ) ) {
					const attributes = getBlockAttributes( clientId );
					const update = unsetGridPositionAttributes( attributes );
					if ( update ) {
						updates[ clientId ] = update;
					}
				}
			} );
		} else {
			// Remove all of the columnStart and rowStart values
			// when switching from manual to auto mode,
			if ( previousIsManualPlacement === true ) {
				for ( const clientId of blockOrder ) {
					const attributes = getBlockAttributes( clientId );
					const update = unsetGridPositionAttributes( attributes );
					if ( update ) {
						updates[ clientId ] = update;
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
		updateBlockAttributes,
	] );
}

/**
 * @param {GridRect[]} occupiedRects
 * @param {number}     gridColumnCount
 * @param {number}     blockColumnSpan
 * @param {number}     blockRowSpan
 * @param {number?}    startColumn
 * @param {number?}    startRow
 */
function placeBlock(
	occupiedRects,
	gridColumnCount,
	blockColumnSpan,
	blockRowSpan,
	startColumn = 1,
	startRow = 1
) {
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
