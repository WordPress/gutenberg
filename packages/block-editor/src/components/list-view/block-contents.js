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
			...props
		},
		ref
	) => {
		const { clientId } = block;

		const { blockMovingClientId, selectedBlockInBlockEditor } = useSelect(
			( select ) => {
				const {
					getBlockRootClientId,
					hasBlockMovingClientId,
					getSelectedBlockClientId,
				} = select( blockEditorStore );
				return {
					rootClientId: getBlockRootClientId( clientId ) || '',
					blockMovingClientId: hasBlockMovingClientId(),
					selectedBlockInBlockEditor: getSelectedBlockClientId(),
				};
			},
			[ clientId ]
		);

		const isBlockMoveTarget =
			blockMovingClientId && selectedBlockInBlockEditor === clientId;

		const className = classnames( 'block-editor-list-view-block-contents', {
			'is-dropping-before': isBlockMoveTarget,
		} );

		return (
			<BlockDraggable clientIds={ [ block.clientId ] }>
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
						{ ...props }
					/>
				) }
			</BlockDraggable>
		);
	}
);

export default ListViewBlockContents;
