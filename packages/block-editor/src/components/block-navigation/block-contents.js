/**
 * WordPress dependencies
 */
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
		} = useBlockNavigationContext();

		return (
			<BlockDraggable
				clientIds={ [ block.clientId ] }
				elementId={ `block-navigation-block-${ block.clientId }` }
			>
				{ ( { isDraggable, onDraggableStart, onDraggableEnd } ) =>
					withBlockNavigationSlots ? (
						<BlockNavigationBlockSlot
							ref={ ref }
							className="block-editor-block-navigation-block-contents"
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
							className="block-editor-block-navigation-block-contents"
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
