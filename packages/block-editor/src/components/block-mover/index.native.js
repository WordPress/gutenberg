/**
 * External dependencies
 */
import { I18nManager } from 'react-native';
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
	backwardButtonIcon: arrowLeft,
	forwardButtonIcon: arrowRight,
	backwardButtonHint: __( 'Double tap to move the block to the left' ),
	forwardButtonHint: __( 'Double tap to move the block to the right' ),
	firstBlockTitle: __( 'Move block left' ),
	lastBlockTitle: __( 'Move block right' ),
	/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
	backwardButtonTitle: __(
		'Move block left from position %1$s to position %2$s'
	),
	/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
	forwardButtonTitle: __(
		'Move block right from position %1$s to position %2$s'
	),
};

const verticalMover = {
	backwardButtonIcon: arrowUp,
	forwardButtonIcon: arrowDown,
	backwardButtonHint: __( 'Double tap to move the block up' ),
	forwardButtonHint: __( 'Double tap to move the block down' ),
	firstBlockTitle: __( 'Move block up' ),
	lastBlockTitle: __( 'Move block down' ),
	/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
	backwardButtonTitle: __( 'Move block up from row %1$s to row %2$s' ),
	/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
	forwardButtonTitle: __( 'Move block down from row %1$s to row %2$s' ),
};

const BlockMover = ( {
	isFirst,
	isLast,
	isRTL,
	isLocked,
	onMoveDown,
	onMoveUp,
	firstIndex,
	rootClientId,
	horizontalDirection,
} ) => {
	const {
		backwardButtonIcon,
		forwardButtonIcon,
		backwardButtonHint,
		forwardButtonHint,
		firstBlockTitle,
		lastBlockTitle,
	} = horizontalDirection ? horizontalMover : verticalMover;

	if ( isLocked || ( isFirst && isLast && ! rootClientId ) ) {
		return null;
	}

	const switchButtonPropIfRTL = (
		isBackwardButton,
		forwardButtonProp,
		backwardButtonProp
	) => {
		if ( isRTL && horizontalDirection ) {
			// for RTL and horizontal direction switch prop between forward and backward button
			if ( isBackwardButton ) {
				return forwardButtonProp; // set forwardButtonProp for backward button
			}
			return backwardButtonProp; // set backwardButtonProp for forward button
		}

		return isBackwardButton ? backwardButtonProp : forwardButtonProp;
	};

	const getMoverButtonTitle = ( isBackwardButton ) => {
		const fromIndex = firstIndex + 1; // current position based on index
		// for backwardButton decrease index (move left/up) for forwardButton increase index (move right/down)
		const direction = isBackwardButton ? -1 : 1;
		const toIndex = fromIndex + direction; // position after move

		const { backwardButtonTitle, forwardButtonTitle } = horizontalDirection
			? horizontalMover
			: verticalMover;

		const buttonTitle = switchButtonPropIfRTL(
			isBackwardButton,
			forwardButtonTitle,
			backwardButtonTitle
		);

		return sprintf( buttonTitle, fromIndex, toIndex );
	};

	const getArrowIcon = ( isBackwardButton ) =>
		switchButtonPropIfRTL(
			isBackwardButton,
			forwardButtonIcon,
			backwardButtonIcon
		);

	return (
		<>
			<ToolbarButton
				title={
					! isFirst ? getMoverButtonTitle( true ) : firstBlockTitle
				}
				isDisabled={ isFirst }
				onClick={ onMoveUp }
				icon={ getArrowIcon( true ) }
				extraProps={ { hint: backwardButtonHint } }
			/>

			<ToolbarButton
				title={ ! isLast ? getMoverButtonTitle() : lastBlockTitle }
				isDisabled={ isLast }
				onClick={ onMoveDown }
				icon={ getArrowIcon() }
				extraProps={ {
					hint: forwardButtonHint,
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
			isRTL: I18nManager.isRTL,
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
