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

		const { columnCount, rowCount } = gridLayout;
		const isManualGrid = !! columnCount;

		if ( isManualGrid ) {
			const rects = [];

			// Respect the position of blocks that already have a columnStart and rowStart value.
			for ( const clientId of blockOrder ) {
				const attributes = getBlockAttributes( clientId );
				const { columnStart, rowStart, columnSpan, rowSpan } =
					attributes.style?.layout;
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
				const { columnStart, rowStart, columnSpan, rowSpan } =
					attributes.style?.layout;
				if ( columnStart && rowStart ) {
					continue;
				}
				const [ newColumnStart, newRowStart ] = getFirstEmptyCell(
					rects,
					columnCount,
					rowCount,
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
		} else {
			// When in auto mode, remove all of the columnStart and rowStart values.
			for ( const clientId of blockOrder ) {
				const attributes = getBlockAttributes( clientId );
				const { columnStart, rowStart, ...layout } =
					attributes.style?.layout;
				updates[ clientId ] = {
					style: {
						...attributes.style,
						layout,
					},
				};
			}
		}

		if ( Object.keys( updates ).length ) {
			// TODO: remove this console log
			// eslint-disable-next-line no-console
			console.log( 'useGridLayoutSync updates', updates );
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes(
				Object.keys( updates ),
				updates,
				/* uniqueByBlock: */ true
			);
		}
	}, [
		__unstableMarkNextChangeAsNotPersistent,
		blockOrder,
		getBlockAttributes,
		gridLayout,
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
