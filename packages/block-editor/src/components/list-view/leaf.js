/**
 * External dependencies
 */
import { animated } from '@react-spring/web';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalTreeGridRow as TreeGridRow } from '@wordpress/components';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useMovingAnimation from '../use-moving-animation';

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
		const animationRef = useMovingAnimation( {
			clientId: props[ 'data-block' ],
			enableAnimation: true,
			triggerAnimationOnChange: path,
			elementSelector: isDragged
				? '.block-editor-list-view-draggable-chip .block-editor-list-view-leaf'
				: undefined,
		} );

		const mergedRef = useMergeRefs( [ ref, animationRef ] );

		return (
			<AnimatedTreeGridRow
				ref={ mergedRef }
				className={ classnames(
					'block-editor-list-view-leaf',
					className
				) }
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
