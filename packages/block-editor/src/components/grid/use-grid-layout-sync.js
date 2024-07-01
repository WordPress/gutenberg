/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { GridRect } from './utils';

export function useGridLayoutSync( { clientId: gridClientId } ) {
	const { getBlockOrder, getBlockAttributes } = useSelect( blockEditorStore );
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const blockOrder = getBlockOrder( gridClientId );

	useEffect( () => {
		const gridLayout = getBlockAttributes( gridClientId ).layout ?? {};
		const updates = {};
		const { columnCount, rowCount, manualPlacement } = gridLayout;
		const isManualGrid = !! manualPlacement;

		if ( isManualGrid ) {
			const rects = [];
			let cellsTaken = 0;
			let lowestRowEnd = 0;

			// Respect the position of blocks that already have a columnStart and rowStart value.
			for ( const clientId of blockOrder ) {
				const attributes = getBlockAttributes( clientId );
				const {
					columnStart,
					rowStart,
					columnSpan = 1,
					rowSpan = 1,
				} = attributes.style?.layout || {};
				cellsTaken += columnSpan * rowSpan;
				if ( ! columnStart || ! rowStart ) {
					continue;
				}
				rects.push(
					new GridRect( {
						columnStart,
						rowStart,
						columnSpan,
						rowSpan,
					} )
				);
				lowestRowEnd = Math.max( lowestRowEnd, rowStart + rowSpan - 1 );
			}

			// Ensure there's enough rows to fit all blocks.
			const minimumNeededRows = Math.ceil( cellsTaken / columnCount );

			// When in manual mode, ensure that every block has a columnStart and rowStart value.
			for ( const clientId of blockOrder ) {
				const attributes = getBlockAttributes( clientId );
				const { columnStart, rowStart, columnSpan, rowSpan } =
					attributes.style?.layout || {};
				if ( columnStart && rowStart ) {
					continue;
				}
				const [ newColumnStart, newRowStart ] = getFirstEmptyCell(
					rects,
					columnCount,
					minimumNeededRows,
					columnSpan,
					rowSpan
				);
				rects.push(
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
				lowestRowEnd = Math.max( lowestRowEnd, rowStart + rowSpan - 1 );
			}
			if ( rowCount < lowestRowEnd ) {
				updates[ gridClientId ] = {
					layout: {
						...gridLayout,
						rowCount: minimumNeededRows,
					},
				};
			}
		} else {
			// When in auto mode, remove all of the columnStart and rowStart values.
			for ( const clientId of blockOrder ) {
				const attributes = getBlockAttributes( clientId );
				const { columnStart, rowStart, ...layout } =
					attributes.style?.layout || {};
				// Only update attributes if columnStart or rowStart are set.
				if ( columnStart || rowStart ) {
					updates[ clientId ] = {
						style: {
							...attributes.style,
							layout,
						},
					};
				}
			}
			// Remove row styles in auto mode
			if ( rowCount ) {
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
		blockOrder,
		// Needed for linter:
		__unstableMarkNextChangeAsNotPersistent,
		getBlockAttributes,
		updateBlockAttributes,
	] );
}

function getFirstEmptyCell(
	rects,
	columnCount,
	rowCount,
	columnSpan = 1,
	rowSpan = 1
) {
	for ( let row = 1; row <= rowCount; row++ ) {
		for ( let column = 1; column <= columnCount; column++ ) {
			const rect = new GridRect( {
				columnStart: column,
				rowStart: row,
				columnSpan,
				rowSpan,
			} );
			if ( ! rects.some( ( r ) => r.intersectsRect( rect ) ) ) {
				return [ column, row ];
			}
		}
	}
	return [ 1, 1 ];
}
