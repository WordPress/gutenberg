import { animated } from '@react-spring/web';
import clsx from 'clsx';
import { __experimentalTreeGridRow as TreeGridRow } from '@wordpress/components';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';
import useMovingAnimation from '../use-moving-animation';
import { useListViewContext } from './context';
import { getDragChipId } from './drag-chip';

const AnimatedTreeGridRow = animated( TreeGridRow );

const ListViewLeaf = forwardRef(
	(
		{
			isDragged,
			isSelected,
			position,
			level,
			rowCount,
			children,
			className,
			path,
			...props
		},
		ref
	) => {
		const { listViewInstanceId } = useListViewContext();

		// When a dragged row is dropped, animate it from the drag chip.
		const getPreviousRect = isDragged
			? ( element ) =>
					element.ownerDocument
						.getElementById( getDragChipId( listViewInstanceId ) )
						?.getBoundingClientRect()
			: undefined;

		const animationRef = useMovingAnimation( {
			clientId: props[ 'data-block' ],
			enableAnimation: true,
			triggerAnimationOnChange: path,
			getPreviousRect,
		} );

		const mergedRef = useMergeRefs( [ ref, animationRef ] );

		return (
			<AnimatedTreeGridRow
				ref={ mergedRef }
				className={ clsx( 'block-editor-list-view-leaf', className ) }
				level={ level }
				positionInSet={ position }
				setSize={ rowCount }
				isExpanded={ undefined }
				{ ...props }
			>
				{ children }
			</AnimatedTreeGridRow>
		);
	}
);

export default ListViewLeaf;
