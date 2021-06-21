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

export default function BlockNavigationLeaf( {
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
		triggerAnimationOnChange: path.join( '_' ),
	} );

	return (
		<AnimatedTreeGridRow
			ref={ ref }
			className={ classnames(
				'block-editor-block-navigation-leaf',
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
