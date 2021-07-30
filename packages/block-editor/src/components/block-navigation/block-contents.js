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
import { useBlockNavigationContext } from './context';
import BlockNavigationBlockSlot from './block-slot';
import BlockNavigationBlockSelectButton from './block-select-button';
import BlockDraggable from '../block-draggable';
import { store as blockEditorStore } from '../../store';

const BlockNavigationBlockContents = forwardRef(
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
		} = useBlockNavigationContext();

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

		const className = classnames(
			'block-editor-block-navigation-block-contents',
			{
				'is-dropping-before': isDroppingBefore || isBlockMoveTarget,
				'is-dropping-after': isDroppingAfter,
				'is-dropping-to-inner-blocks': isDroppingToInnerBlocks,
			}
		);

		return (
			<BlockDraggable
				clientIds={ [ block.clientId ] }
				elementId={ `block-navigation-block-${ block.clientId }` }
			>
				{ ( { draggable, onDragStart, onDragEnd } ) =>
					__experimentalFeatures ? (
						<BlockNavigationBlockSlot
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
						<BlockNavigationBlockSelectButton
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

export default BlockNavigationBlockContents;
