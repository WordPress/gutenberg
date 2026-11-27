import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { getUpdatedChildLayoutStyle } from '../../hooks/layout-child-utils';
import { hasViewportBlockStyleState } from '../../hooks/block-style-state';
import { isPlainObject } from '../../utils/object';
import type { ChildLayoutBlockStyle } from '../../hooks/types';
import { useGetNumberOfBlocksBeforeCell } from './use-get-number-of-blocks-before-cell';
import type { GridDropBlock, GridDropPlacement } from './types';

type ManualGridDropItem = GridDropBlock & GridDropPlacement;

export function useManualGridDrop( gridClientId: string, numColumns: number ) {
	const registry = useRegistry();
	const { getBlockAttributes, getBlockOrder, getBlockRootClientId } =
		useSelect( blockEditorStore );
	const {
		updateBlockAttributes,
		moveBlocksToPosition,
		moveBlockToPosition,
		__unstableMarkLastChangeAsPersistent,
	} = useDispatch( blockEditorStore );
	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		gridClientId,
		numColumns
	);
	const getCellIndex = ( {
		columnStart,
		rowStart,
	}: {
		columnStart: number;
		rowStart: number;
	} ) => ( rowStart - 1 ) * numColumns + columnStart - 1;

	function moveSelectionIntoReadingOrder(
		items: ManualGridDropItem[],
		clientIds: string[]
	) {
		const draggedIds = new Set( clientIds );
		const siblings = getBlockOrder( gridClientId ).filter(
			( clientId ) => ! draggedIds.has( clientId )
		);
		const siblingCells = siblings
			.map( ( clientId ) => {
				const style = getBlockAttributes( clientId )?.style;
				const layout =
					isPlainObject( style ) && isPlainObject( style.layout )
						? style.layout
						: {};
				const { columnStart, rowStart } = layout;
				return typeof columnStart === 'number' &&
					Number.isFinite( columnStart ) &&
					typeof rowStart === 'number' &&
					Number.isFinite( rowStart )
					? getCellIndex( { columnStart, rowStart } )
					: Infinity;
			} )
			.sort( ( a, b ) => a - b );
		const orderedItems = items.toSorted(
			( a, b ) => getCellIndex( a.rect ) - getCellIndex( b.rect )
		);

		// Work backwards so each item can be inserted before a sibling or an
		// already placed item. Keep the other siblings in their existing order.
		let siblingIndex = siblings.length;
		let nextClientId: string | undefined;
		for ( let i = orderedItems.length - 1; i >= 0; i-- ) {
			const { clientId, rect } = orderedItems[ i ];
			const cellIndex = getCellIndex( rect );
			while (
				siblingIndex > 0 &&
				siblingCells[ siblingIndex - 1 ] >= cellIndex
			) {
				nextClientId = siblings[ --siblingIndex ];
			}

			const order = getBlockOrder( gridClientId );
			const fromIndex = order.indexOf( clientId );
			const nextIndex = nextClientId
				? order.indexOf( nextClientId )
				: order.length;
			const toIndex = fromIndex < nextIndex ? nextIndex - 1 : nextIndex;
			if ( fromIndex !== toIndex ) {
				moveBlockToPosition(
					clientId,
					gridClientId,
					gridClientId,
					toIndex
				);
			}
			nextClientId = clientId;
		}
	}

	return (
		items: ManualGridDropItem[],
		sourceRootClientId: string | null
	) => {
		const clientIds = items.map( ( { clientId } ) => clientId );
		const updates: Record<
			string,
			{ style: ChildLayoutBlockStyle | undefined }
		> = {};
		for ( const { clientId, attributes, selectedState, rect } of items ) {
			updates[ clientId ] = {
				style: getUpdatedChildLayoutStyle(
					isPlainObject( attributes.style )
						? ( attributes.style as ChildLayoutBlockStyle )
						: undefined,
					{
						columnStart: rect.columnStart,
						rowStart: rect.rowStart,
						columnSpan: rect.columnSpan,
						rowSpan: rect.rowSpan,
					},
					selectedState
				),
			};
		}
		const hasViewportPlacement = items.some( ( { selectedState } ) =>
			hasViewportBlockStyleState( selectedState )
		);
		const reorderSelection = ! hasViewportPlacement && items.length > 1;
		registry.batch( () => {
			updateBlockAttributes( clientIds, updates, {
				uniqueByBlock: true,
			} );
			// Reparent the whole selection together, so move permissions are
			// checked against the same source and destination state.
			if (
				sourceRootClientId !== gridClientId ||
				( ! hasViewportPlacement && ! reorderSelection )
			) {
				const firstRect = items.reduce(
					( first, { rect } ) =>
						getCellIndex( rect ) < getCellIndex( first )
							? rect
							: first,
					items[ 0 ].rect
				);
				moveBlocksToPosition(
					clientIds,
					sourceRootClientId,
					gridClientId,
					getNumberOfBlocksBeforeCell(
						firstRect.columnStart,
						firstRect.rowStart
					)
				);
			}
			if (
				reorderSelection &&
				getBlockRootClientId( clientIds[ 0 ] ) === gridClientId
			) {
				moveSelectionIntoReadingOrder( items, clientIds );
			}
			// Commit placement and order together, including consecutive drops
			// that update the same style attributes without changing block order.
			__unstableMarkLastChangeAsPersistent();
		} );
	};
}
