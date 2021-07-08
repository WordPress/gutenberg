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
import { useListViewContext } from './context';
import ListViewBlockSlot from './block-slot';
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
		const {
			__experimentalFeatures,
			blockDropTarget = {},
		} = useListViewContext();

		const { clientId } = block;

		const {
			rootClientId,
			blockMovingClientId,
			selectedBlockInBlockEditor,
		} = useSelect(
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

		const {
			rootClientId: dropTargetRootClientId,
			clientId: dropTargetClientId,
			dropPosition,
		} = blockDropTarget;

		const isDroppingBefore =
			dropTargetRootClientId === rootClientId &&
			dropTargetClientId === clientId &&
			dropPosition === 'top';
		const isDroppingAfter =
			dropTargetRootClientId === rootClientId &&
			dropTargetClientId === clientId &&
			dropPosition === 'bottom';
		const isDroppingToInnerBlocks =
			dropTargetRootClientId === clientId && dropPosition === 'inside';

		const className = classnames( 'block-editor-list-view-block-contents', {
			'is-dropping-before': isDroppingBefore || isBlockMoveTarget,
			'is-dropping-after': isDroppingAfter,
			'is-dropping-to-inner-blocks': isDroppingToInnerBlocks,
		} );

		return (
			<BlockDraggable
				clientIds={ [ block.clientId ] }
				elementId={ `list-view-block-${ block.clientId }` }
			>
				{ ( { draggable, onDragStart, onDragEnd } ) =>
					__experimentalFeatures ? (
						<ListViewBlockSlot
							ref={ ref }
							className={ className }
							block={ block }
							onToggleExpanded={ onToggleExpanded }
							isSelected={ isSelected }
							position={ position }
							siblingBlockCount={ siblingBlockCount }
							level={ level }
							draggable={ draggable && __experimentalFeatures }
							onDragStart={ onDragStart }
							onDragEnd={ onDragEnd }
							{ ...props }
						/>
					) : (
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
							draggable={ draggable && __experimentalFeatures }
							onDragStart={ onDragStart }
							onDragEnd={ onDragEnd }
							{ ...props }
						/>
					)
				}
			</BlockDraggable>
		);
	}
);

export default ListViewBlockContents;
