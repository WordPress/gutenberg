/**
 * External dependencies
 */
import { animated } from 'react-spring/web.cjs';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, VisuallyHidden } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import useMovingAnimation from '../use-moving-animation';

const AnimatedListItem = animated( 'li' );

export default function BlockNavigationItem( {
	blockIndex,
	children,
	icon,
	isSelected,
	label,
	onClick,
} ) {
	const wrapper = useRef( null );
	const adjustScrolling = false;
	const enableAnimation = true;
	const animateOnChange = blockIndex;
	const style = useMovingAnimation(
		wrapper,
		isSelected,
		adjustScrolling,
		enableAnimation,
		animateOnChange
	);

	return (
		<AnimatedListItem ref={ wrapper } style={ style }>
			<div className="block-editor-block-navigation__item-inner">
				<Button
					className={ classnames(
						'block-editor-block-navigation__item-button',
						{
							'is-selected': isSelected,
						}
					) }
					onClick={ onClick }
				>
					<BlockIcon icon={ icon } showColors />
					{ label }
					{ isSelected && (
						<VisuallyHidden as="span">
							{ __( '(selected block)' ) }
						</VisuallyHidden>
					) }
				</Button>
			</div>
			{ children }
		</AnimatedListItem>
	);
}
