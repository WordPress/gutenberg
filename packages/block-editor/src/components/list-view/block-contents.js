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

		const { AdditionalBlockContent, insertedBlock, setInsertedBlock } =
			useListViewContext();

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
						clientId={ clientId }
						insertedBlock={ insertedBlock }
						setInsertedBlock={ setInsertedBlock }
					/>
				) }
				<BlockDraggable
					appendToOwnerDocument
					clientIds={ draggableClientIds }
					cloneClassname={ 'block-editor-list-view-draggable-chip' }
				>
					{ ( { draggable, onDragStart, onDragEnd } ) => (
						<ListViewBlockSelectButton
							ref={ ref }
							className={ className }
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
