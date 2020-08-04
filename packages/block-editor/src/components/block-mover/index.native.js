/**
 * External dependencies
 */
import { first, last, partial, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getMoversSetup } from './mover-description';

const BlockMover = ( {
	isFirst,
	isLast,
	isLocked,
	onMoveDown,
	onMoveUp,
	firstIndex,
	rootClientId,
	isStackedHorizontally,
} ) => {
	const {
		description: {
			backwardButtonHint,
			forwardButtonHint,
			firstBlockTitle,
			lastBlockTitle,
		},
		icon: { backward: backwardButtonIcon, forward: forwardButtonIcon },
		title: { backward: backwardButtonTitle, forward: forwardButtonTitle },
	} = getMoversSetup( isStackedHorizontally, { firstIndex } );

	if ( isLocked || ( isFirst && isLast && ! rootClientId ) ) {
		return null;
	}

	return (
		<>
			<ToolbarButton
				title={ ! isFirst ? backwardButtonTitle : firstBlockTitle }
				isDisabled={ isFirst }
				onClick={ onMoveUp }
				icon={ backwardButtonIcon }
				extraProps={ { hint: backwardButtonHint } }
			/>

			<ToolbarButton
				title={ ! isLast ? forwardButtonTitle : lastBlockTitle }
				isDisabled={ isLast }
				onClick={ onMoveDown }
				icon={ forwardButtonIcon }
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
