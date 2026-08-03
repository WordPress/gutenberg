/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ListViewBlockSelectButton from './block-select-button';
import BlockDraggable from '../block-draggable';
import { useListViewContext } from './context';

const ListViewBlockContents = forwardRef(
	(
		{
			onClick,
			onToggleExpanded,
			clientId,
			isSelected,
			position,
			siblingBlockCount,
			level,
			isExpanded,
			selectedClientIds,
			...props
		},
		ref
	) => {
		const {
			AdditionalBlockContent,
			insertedBlockClientId,
			setInsertedBlockClientId,
		} = useListViewContext();

		// Only include all selected blocks if the currently clicked on block
		// is one of the selected blocks. This ensures that if a user attempts
		// to drag a block that isn't part of the selection, they're still able
		// to drag it and rearrange its position.
		const draggableClientIds = selectedClientIds.includes( clientId )
			? selectedClientIds
			: [ clientId ];

		// The additional content is only relevant to the row of the block that
		// was just inserted, so the other rows skip mounting it entirely.
		const showAdditionalBlockContent =
			!! AdditionalBlockContent && insertedBlockClientId === clientId;

		return (
			<>
				{ showAdditionalBlockContent && (
					<AdditionalBlockContent
						insertedBlockClientId={ insertedBlockClientId }
						setInsertedBlockClientId={ setInsertedBlockClientId }
					/>
				) }
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
							isSelected={ isSelected }
							position={ position }
							siblingBlockCount={ siblingBlockCount }
							level={ level }
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
