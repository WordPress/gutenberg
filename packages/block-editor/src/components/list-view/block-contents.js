/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ListViewBlockSelectButton from './block-select-button';
import BlockDraggable from '../block-draggable';
import { store as blockEditorStore } from '../../store';
import { useListViewContext } from './context';
import useDragChip from './use-drag-chip';

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

		const { blockMovingClientId, selectedBlockInBlockEditor } = useSelect(
			( select ) => {
				const { hasBlockMovingClientId, getSelectedBlockClientId } =
					select( blockEditorStore );
				return {
					blockMovingClientId: hasBlockMovingClientId(),
					selectedBlockInBlockEditor: getSelectedBlockClientId(),
				};
			},
			[]
		);

		const {
			AdditionalBlockContent,
			blockDropTarget,
			insertedBlock,
			listViewInstanceId,
			setInsertedBlock,
			treeGridElementRef,
		} = useListViewContext();

		const { dragChipOnDragStart, dragChipOnDragEnd } = useDragChip( {
			blockDropTarget,
			cloneClassname: 'block-editor-list-view-draggable-chip',
			listViewRef: treeGridElementRef,
			elementId: `list-view-${ listViewInstanceId }-block-${ clientId }`,
		} );

		const isBlockMoveTarget =
			blockMovingClientId && selectedBlockInBlockEditor === clientId;

		const className = classnames( 'block-editor-list-view-block-contents', {
			'is-dropping-before': isBlockMoveTarget,
		} );

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
					cloneClassname={
						'block-editor-list-view-default-draggable-chip'
					}
				>
					{ ( { draggable, onDragStart, onDragEnd } ) => (
						<ListViewBlockSelectButton
							ref={ ref }
							className={ className }
							block={ block }
							onClick={ onClick }
							onToggleExpanded={ onToggleExpanded }
							isSelected={ isSelected }
							position={ position }
							siblingBlockCount={ siblingBlockCount }
							level={ level }
							draggable={ draggable }
							onDragStart={ ( event ) => {
								onDragStart( event );
								dragChipOnDragStart( event );
							} }
							onDragEnd={ ( event ) => {
								onDragEnd( event );
								dragChipOnDragEnd( event );
							} }
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
