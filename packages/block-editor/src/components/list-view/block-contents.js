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
			...props
		},
		ref
	) => {
		const { clientId } = block;

		const {
			blockMovingClientId,
			selectedBlockInBlockEditor,
			selectedBlocks,
		} = useSelect(
			( select ) => {
				const {
					hasBlockMovingClientId,
					getSelectedBlockClientId,
					getSelectedBlockClientIds,
				} = select( blockEditorStore );
				return {
					blockMovingClientId: hasBlockMovingClientId(),
					selectedBlockInBlockEditor: getSelectedBlockClientId(),
					selectedBlocks: getSelectedBlockClientIds(),
				};
			},
			[ clientId ]
		);

		const isBlockMoveTarget =
			blockMovingClientId && selectedBlockInBlockEditor === clientId;

		const className = classnames( 'block-editor-list-view-block-contents', {
			'is-dropping-before': isBlockMoveTarget,
		} );

		// Only include all selected blocks if the currently clicked on block
		// is one of the selected blocks. This ensures that if a user attempts
		// to drag a block that isn't part of the selection, they're still able
		// to drag it and rearrange its position.
		const draggableClientIds = selectedBlocks.includes( clientId )
			? selectedBlocks
			: [ clientId ];

		return (
			<BlockDraggable clientIds={ draggableClientIds }>
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
						onDragStart={ onDragStart }
						onDragEnd={ onDragEnd }
						isExpanded={ isExpanded }
						{ ...props }
					/>
				) }
			</BlockDraggable>
		);
	}
);

export default ListViewBlockContents;
