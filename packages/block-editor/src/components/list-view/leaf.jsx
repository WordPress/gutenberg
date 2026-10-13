import { animated } from '@react-spring/web';
import clsx from 'clsx';
import { __experimentalTreeGridRow as TreeGridRow } from '@wordpress/components';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';
import useMovingAnimation from '../use-moving-animation';
import useDropLandingAnimation from './use-drop-landing-animation';

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
		const clientId = props[ 'data-block' ];

		const animationRef = useMovingAnimation( {
			clientId,
			enableAnimation: true,
			triggerAnimationOnChange: path,
			// Rows are already shown in their new positions while dragging,
			// so they don't need to animate there on drop. The dragged row
			// lands with `useDropLandingAnimation` instead.
			animateWhileDragging: false,
		} );

		const landingRef = useDropLandingAnimation( {
			clientId,
			isDragged,
			path,
		} );

		const mergedRef = useMergeRefs( [ ref, animationRef, landingRef ] );

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
