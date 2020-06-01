/**
 * External dependencies
 */
import classnames from 'classnames';
import { castArray, first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';
import { __, isRTL as getRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { leftArrow, rightArrow } from './icons';
import { chevronUp, chevronDown } from '@wordpress/icons';
import { getBlockMoverDescription } from './mover-description';

const getArrowIcon = ( direction, orientation ) => {
	const isRTL = getRTL();
	if ( direction === 'up' ) {
		if ( orientation === 'horizontal' ) {
			return isRTL ? rightArrow : leftArrow;
		}
		return chevronUp;
	} else if ( direction === 'down' ) {
		if ( orientation === 'horizontal' ) {
			return isRTL ? leftArrow : rightArrow;
		}
		return chevronDown;
	}
	return null;
};

const getMovementDirectionLabel = ( moveDirection, orientation ) => {
	const isRTL = getRTL();
	if ( moveDirection === 'up' ) {
		if ( orientation === 'horizontal' ) {
			return isRTL ? __( 'Move right' ) : __( 'Move left' );
		}
		return __( 'Move up' );
	} else if ( moveDirection === 'down' ) {
		if ( orientation === 'horizontal' ) {
			return isRTL ? __( 'Move left' ) : __( 'Move right' );
		}
		return __( 'Move down' );
	}
	return null;
};

const BlockMoverButton = forwardRef(
	(
		{
			clientIds,
			direction,
			__experimentalOrientation: orientation,
			...props
		},
		ref
	) => {
		const instanceId = useInstanceId( BlockMoverButton );
		const blocksCount = castArray( clientIds ).length;

		const {
			blockType,
			isDisabled,
			rootClientId,
			isFirst,
			isLast,
			firstIndex,
			moverOrientation,
		} = useSelect(
			( select ) => {
				const {
					getBlockIndex,
					getBlockRootClientId,
					getBlockOrder,
					getBlock,
					getBlockListSettings,
				} = select( 'core/block-editor' );
				const normalizedClientIds = castArray( clientIds );
				const firstClientId = first( normalizedClientIds );
				const blockRootClientId = getBlockRootClientId( firstClientId );
				const firstBlockIndex = getBlockIndex(
					firstClientId,
					blockRootClientId
				);
				const lastBlockIndex = getBlockIndex(
					last( normalizedClientIds ),
					blockRootClientId
				);
				const blockOrder = getBlockOrder( blockRootClientId );
				const block = getBlock( firstClientId );
				const isFirstBlock = firstBlockIndex === 0;
				const isLastBlock = lastBlockIndex === blockOrder.length - 1;
				const { __experimentalMoverDirection = 'vertical' } =
					getBlockListSettings( blockRootClientId ) || {};

				return {
					blockType: block ? getBlockType( block.name ) : null,
					isDisabled: direction === 'up' ? isFirstBlock : isLastBlock,
					rootClientId: blockRootClientId,
					firstIndex: firstBlockIndex,
					isFirst: isFirstBlock,
					isLast: isLastBlock,
					moverOrientation:
						orientation || __experimentalMoverDirection,
				};
			},
			[ clientIds, direction ]
		);

		const { moveBlocksDown, moveBlocksUp } = useDispatch(
			'core/block-editor'
		);
		const moverFunction =
			direction === 'up' ? moveBlocksUp : moveBlocksDown;

		const onClick = ( event ) => {
			moverFunction( clientIds, rootClientId );
			if ( props.onClick ) {
				props.onClick( event );
			}
		};

		const descriptionId = `block-editor-block-mover-button__description-${ instanceId }`;

		return (
			<>
				<Button
					ref={ ref }
					className={ classnames(
						'block-editor-block-mover-button',
						`is-${ direction }-button`
					) }
					icon={ getArrowIcon( direction, moverOrientation ) }
					label={ getMovementDirectionLabel(
						direction,
						moverOrientation
					) }
					aria-describedby={ descriptionId }
					{ ...props }
					onClick={ isDisabled ? null : onClick }
					aria-disabled={ isDisabled }
				/>
				<span
					id={ descriptionId }
					className="block-editor-block-mover-button__description"
				>
					{ getBlockMoverDescription(
						blocksCount,
						blockType && blockType.title,
						firstIndex,
						isFirst,
						isLast,
						direction === 'up' ? -1 : 1,
						moverOrientation
					) }
				</span>
			</>
		);
	}
);

export const BlockMoverUpButton = forwardRef( ( props, ref ) => {
	return <BlockMoverButton direction="up" ref={ ref } { ...props } />;
} );

export const BlockMoverDownButton = forwardRef( ( props, ref ) => {
	return <BlockMoverButton direction="down" ref={ ref } { ...props } />;
} );
