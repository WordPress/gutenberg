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
	const { gridLayout, blockOrder } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockOrder } =
				select( blockEditorStore );
			return {
				gridLayout: getBlockAttributes( gridClientId ).layout ?? {},
				blockOrder: getBlockOrder( gridClientId ),
			};
		},
		[ gridClientId ]
	);

	const { getBlockAttributes } = useSelect( blockEditorStore );
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	useEffect( () => {
		const updates = {};

		const { columnCount, rowCount, isManualPlacement } = gridLayout;

		if ( isManualPlacement ) {
			const rects = [];

			// Respect the position of blocks that already have a columnStart and rowStart value.
			for ( const clientId of blockOrder ) {
				const attributes = getBlockAttributes( clientId );
				const {
					columnStart,
					rowStart,
					columnSpan = 1,
					rowSpan = 1,
				} = attributes.style?.layout || {};
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
			}

			// When in manual mode, ensure that every block has a columnStart and rowStart value.
			for ( const clientId of blockOrder ) {
				const attributes = getBlockAttributes( clientId );
				const {
					columnStart,
					rowStart,
					columnSpan = 1,
					rowSpan = 1,
				} = attributes.style?.layout || {};
				if ( columnStart && rowStart ) {
					continue;
				}
				const [ newColumnStart, newRowStart ] = getFirstEmptyCell(
					rects,
					columnCount,
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
			}

			// Ensure there's enough rows to fit all blocks.
			const bottomMostRow = Math.max( ...rects.map( ( r ) => r.rowEnd ) );
			if ( ! rowCount || rowCount < bottomMostRow ) {
				updates[ gridClientId ] = {
					layout: {
						...gridLayout,
						rowCount: bottomMostRow,
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
		gridLayout,
		blockOrder,
		// Needed for linter:
		__unstableMarkNextChangeAsNotPersistent,
		getBlockAttributes,
		updateBlockAttributes,
	] );
}

function getFirstEmptyCell( rects, columnCount, columnSpan = 1, rowSpan = 1 ) {
	for ( let row = 1; ; row++ ) {
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
}
