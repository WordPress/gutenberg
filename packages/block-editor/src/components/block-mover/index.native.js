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
};

const verticalMover = {
	firstButtonIcon: arrowUp,
	secondButtonIcon: arrowDown,
	firstButtonHint: __( 'Double tap to move the block up' ),
	secondButtonHint: __( 'Double tap to move the block down' ),
	firstBlockTitle: __( 'Move block up' ),
	lastBlockTitle: __( 'Move block down' ),
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
	} = horizontalDirection ? horizontalMover : verticalMover;

	if ( isLocked || ( isFirst && isLast && ! rootClientId ) ) {
		return null;
	}

	const getFirstMoverButtonTitle = () => {
		const fromIndex = firstIndex + 1;
		const toIndex = firstIndex;
		return horizontalDirection
			? sprintf(
					/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
					__( 'Move block left from position %1$s to position %2$s' ),
					fromIndex,
					toIndex
			  )
			: sprintf(
					/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
					__( 'Move block up from row %1$s to row %2$s' ),
					fromIndex,
					toIndex
			  );
	};

	const getSecondMoverButtonTitle = () => {
		const fromIndex = firstIndex + 1;
		const toIndex = firstIndex + 2;
		return horizontalDirection
			? sprintf(
					/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
					__(
						'Move block right from position %1$s to position %2$s'
					),
					fromIndex,
					toIndex
			  )
			: sprintf(
					/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
					__( 'Move block down from row %1$s to row %2$s' ),
					fromIndex,
					toIndex
			  );
	};

	return (
		<>
			<ToolbarButton
				title={
					! isFirst ? getFirstMoverButtonTitle() : firstBlockTitle
				}
				isDisabled={ isFirst }
				onClick={ onMoveUp }
				icon={ firstButtonIcon }
				extraProps={ { hint: firstButtonHint } }
			/>

			<ToolbarButton
				title={
					! isLast ? getSecondMoverButtonTitle() : lastBlockTitle
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
