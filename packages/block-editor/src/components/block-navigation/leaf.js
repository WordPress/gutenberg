/**
 * External dependencies
 */
import { animated } from 'react-spring/web.cjs';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalTreeGridRow as TreeGridRow } from '@wordpress/components';
import { useRef } from '@wordpress/element';

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
	const wrapper = useRef( null );
	const adjustScrolling = false;
	const enableAnimation = true;
	const animateOnChange = path.join( '_' );
	const style = useMovingAnimation(
		wrapper,
		isSelected,
		adjustScrolling,
		enableAnimation,
		animateOnChange
	);

	return (
		<AnimatedTreeGridRow
			ref={ wrapper }
			style={ style }
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
