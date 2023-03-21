/**
 * External dependencies
 */
import { animated } from '@react-spring/web';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalTreeGridRow as TreeGridRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useMovingAnimation from '../use-moving-animation';

const AnimatedTreeGridRow = animated( TreeGridRow );

export default function ListViewLeaf( {
	isSelected,
	position,
	level,
	rowCount,
	children,
	className,
	path,
	...props
} ) {
	const ref = useMovingAnimation( {
		isSelected,
		adjustScrolling: false,
		enableAnimation: true,
		triggerAnimationOnChange: path,
	} );

	return (
		<AnimatedTreeGridRow
			ref={ ref }
			className={ classnames(
				'block-editor-list-view-leaf',
				'offcanvas-editor-list-view-leaf',
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
