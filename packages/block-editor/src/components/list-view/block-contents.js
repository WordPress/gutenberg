import { forwardRef } from '@wordpress/element';
import ListViewBlockSelectButton from './block-select-button';
import BlockDraggable from '../block-draggable';
import { useInsertedBlockClientId, useListViewContext } from './context';

/**
 * Renders the additional block content for the row of the block that was just
 * inserted. Reading the inserted block from its own context keeps an insert
 * from re-rendering the contents of every other row.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId The client ID of the block for this row.
 */
function InsertedBlockContent( { clientId } ) {
	const { AdditionalBlockContent, setInsertedBlockClientId } =
		useListViewContext();
	const insertedBlockClientId = useInsertedBlockClientId();

	if ( ! AdditionalBlockContent || insertedBlockClientId !== clientId ) {
		return null;
	}

	return (
		<AdditionalBlockContent
			insertedBlockClientId={ insertedBlockClientId }
			setInsertedBlockClientId={ setInsertedBlockClientId }
		/>
	);
}

const ListViewBlockContents = forwardRef(
	(
		{
			onClick,
			onToggleExpanded,
			clientId,
			isExpanded,
			selectedClientIds,
			...props
		},
		ref
	) => {
		// Only include all selected blocks if the currently clicked on block
		// is one of the selected blocks. This ensures that if a user attempts
		// to drag a block that isn't part of the selection, they're still able
		// to drag it and rearrange its position.
		const draggableClientIds = selectedClientIds.includes( clientId )
			? selectedClientIds
			: [ clientId ];

		return (
			<>
				<InsertedBlockContent clientId={ clientId } />
				<BlockDraggable
					appendToOwnerDocument
					clientIds={ draggableClientIds }
					cloneClassname="block-editor-list-view-draggable-chip"
				>
					{ ( { draggable, onDragStart, onDragEnd } ) => (
						<ListViewBlockSelectButton
							ref={ ref }
							className="block-editor-list-view-block-contents"
							clientId={ clientId }
							onClick={ onClick }
							onToggleExpanded={ onToggleExpanded }
							draggable={ draggable }
							onDragStart={ onDragStart }
							onDragEnd={ onDragEnd }
							isExpanded={ isExpanded }
							{ ...props }
						/>
					) }
				</BlockDraggable>
			</>
		);
	}
);

export default ListViewBlockContents;
