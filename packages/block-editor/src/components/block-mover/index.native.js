/**
 * External dependencies
 */
import { first, last, partial, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';
import { arrowUp, arrowDown, arrowLeft, arrowRight } from '@wordpress/icons';

const horizontalMover = {
	firstButtonIcon: arrowLeft,
	secondButtonIcon: arrowRight,
	firstButtonHint: __( 'Double tap to move the block to the left' ),
	secondButtonHint: __( 'Double tap to move the block to the right' ),
	firstBlockTitle: __( 'Move block left' ),
	lastBlockTitle: __( 'Move block right' ),
	firstButtonDirection: __( 'left' ),
	secondButtonDirection: __( 'right' ),
	location: 'position',
};

const verticalMover = {
	firstButtonIcon: arrowUp,
	secondButtonIcon: arrowDown,
	firstButtonHint: __( 'Double tap to move the block up' ),
	secondButtonHint: __( 'Double tap to move the block down' ),
	firstBlockTitle: __( 'Move block up' ),
	lastBlockTitle: __( 'Move block down' ),
	firstButtonDirection: __( 'up' ),
	secondButtonDirection: __( 'down' ),
	location: 'row',
};

const BlockMover = ( {
	isFirst,
	isLast,
	isLocked,
	onMoveDown,
	onMoveUp,
	firstIndex,
	rootClientId,
	horizontalDirection,
} ) => {
	const {
		firstButtonIcon,
		secondButtonIcon,
		firstButtonHint,
		secondButtonHint,
		firstBlockTitle,
		lastBlockTitle,
		firstButtonDirection,
		secondButtonDirection,
		location,
	} = horizontalDirection ? horizontalMover : verticalMover;

	if ( isLocked || ( isFirst && isLast && ! rootClientId ) ) {
		return null;
	}

	return (
		<>
			<ToolbarButton
				title={
					! isFirst
						? sprintf(
								/* translators: accessibility text. %1: block moving direction (string). %2: location of block - row or order number (string). %3: current block position (number). %4: next block position (number) */
								__(
									'Move block %2$s from %1$s %3$s to %1$s %4$s'
								),
								location,
								firstButtonDirection,
								firstIndex + 1,
								firstIndex
						  )
						: firstBlockTitle
				}
				isDisabled={ isFirst }
				onClick={ onMoveUp }
				icon={ firstButtonIcon }
				extraProps={ { hint: firstButtonHint } }
			/>

			<ToolbarButton
				title={
					! isLast
						? sprintf(
								/* translators: accessibility text. %1: block moving direction (string). %2: location of block - row or order number (string). %3: current block position (number). %4: next block position (number) */
								__(
									'Move block %2$s from %1$s %3$s to %1$s %4$s'
								),
								location,
								secondButtonDirection,
								firstIndex + 1,
								firstIndex + 2
						  )
						: lastBlockTitle
				}
				isDisabled={ isLast }
				onClick={ onMoveDown }
				icon={ secondButtonIcon }
				extraProps={ {
					hint: secondButtonHint,
				} }
			/>
		</>
	);
};

export default compose(
	withSelect( ( select, { clientIds } ) => {
		const {
			getBlockIndex,
			getTemplateLock,
			getBlockRootClientId,
			getBlockOrder,
		} = select( 'core/block-editor' );
		const normalizedClientIds = castArray( clientIds );
		const firstClientId = first( normalizedClientIds );
		const rootClientId = getBlockRootClientId( firstClientId );
		const blockOrder = getBlockOrder( rootClientId );
		const firstIndex = getBlockIndex( firstClientId, rootClientId );
		const lastIndex = getBlockIndex(
			last( normalizedClientIds ),
			rootClientId
		);

		return {
			firstIndex,
			isFirst: firstIndex === 0,
			isLast: lastIndex === blockOrder.length - 1,
			isLocked: getTemplateLock( rootClientId ) === 'all',
			rootClientId,
		};
	} ),
	withDispatch( ( dispatch, { clientIds, rootClientId } ) => {
		const { moveBlocksDown, moveBlocksUp } = dispatch(
			'core/block-editor'
		);
		return {
			onMoveDown: partial( moveBlocksDown, clientIds, rootClientId ),
			onMoveUp: partial( moveBlocksUp, clientIds, rootClientId ),
		};
	} ),
	withInstanceId
)( BlockMover );
