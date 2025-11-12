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
			block,
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
		const { clientId } = block;
		const { AdditionalBlockContent, insertedBlock, setInsertedBlock } =
			useListViewContext();

		// Only include all selected blocks if the currently clicked on block
		// is one of the selected blocks. This ensures that if a user attempts
		// to drag a block that isn't part of the selection, they're still able
		// to drag it and rearrange its position.
		const draggableClientIds = selectedClientIds.includes( clientId )
			? selectedClientIds
			: [ clientId ];

		return (
			<>
				{ AdditionalBlockContent && (
					<AdditionalBlockContent
						block={ block }
						insertedBlock={ insertedBlock }
						setInsertedBlock={ setInsertedBlock }
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
							block={ block }
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
