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
			isSelected,
			adjustScrolling: false,
			enableAnimation: true,
			triggerAnimationOnChange: path,
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
				{ ...props }
			>
				{ children }
			</AnimatedTreeGridRow>
		);
	}
);

export default ListViewLeaf;
