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

const BlockNavigationBlockContents = forwardRef(
	(
		{
			onClick,
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
			__experimentalFeatures: withBlockNavigationSlots,
			blockDropTarget = {},
		} = useBlockNavigationContext();

		const rootClientId = useSelect(
			( select ) =>
				select( 'core/block-editor' ).getBlockRootClientId(
					block.clientId
				) || '',
			[ block.rootClientId ]
		);

		const {
			rootClientId: dropTargetRootClientId,
			blockIndex: dropTargetBlockIndex,
		} = blockDropTarget;

		const blockIndex = position - 1;

		const isDroppingBefore =
			dropTargetRootClientId === rootClientId &&
			blockIndex === dropTargetBlockIndex;
		const isDroppingAfter =
			dropTargetRootClientId === rootClientId &&
			position === siblingBlockCount &&
			dropTargetBlockIndex === siblingBlockCount;
		const isDroppingToInnerBlocks =
			block.clientId === dropTargetRootClientId &&
			! block.innerBlocks?.length &&
			dropTargetBlockIndex === 0;

		const className = classnames(
			'block-editor-block-navigation-block-contents',
			{
				'is-dropping-before': isDroppingBefore,
				'is-dropping-after': isDroppingAfter,
				'is-dropping-to-inner-blocks': isDroppingToInnerBlocks,
			}
		);

		return (
			<BlockDraggable
				clientIds={ [ block.clientId ] }
				elementId={ `block-navigation-block-${ block.clientId }` }
			>
				{ ( { isDraggable, onDraggableStart, onDraggableEnd } ) =>
					withBlockNavigationSlots ? (
						<BlockNavigationBlockSlot
							ref={ ref }
							className={ className }
							block={ block }
							onClick={ onClick }
							isSelected={ isSelected }
							position={ position }
							siblingBlockCount={ siblingBlockCount }
							level={ level }
							draggable={ isDraggable }
							onDragStart={ onDraggableStart }
							onDragEnd={ onDraggableEnd }
							{ ...props }
						/>
					) : (
						<BlockNavigationBlockSelectButton
							ref={ ref }
							className={ className }
							block={ block }
							onClick={ onClick }
							isSelected={ isSelected }
							position={ position }
							siblingBlockCount={ siblingBlockCount }
							level={ level }
							draggable={ isDraggable }
							onDragStart={ onDraggableStart }
							onDragEnd={ onDraggableEnd }
							{ ...props }
						/>
					)
				}
			</BlockDraggable>
		);
	}
);

export default BlockNavigationBlockContents;
