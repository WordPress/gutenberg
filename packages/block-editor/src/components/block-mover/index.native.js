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
import {
	getMoverDescription,
	getArrowIcon,
	getMoverButtonTitle,
} from './mover-description';

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
		backwardButtonHint,
		forwardButtonHint,
		firstBlockTitle,
		lastBlockTitle,
	} = getMoverDescription( isStackedHorizontally );

	if ( isLocked || ( isFirst && isLast && ! rootClientId ) ) {
		return null;
	}

	return (
		<>
			<ToolbarButton
				title={
					! isFirst
						? getMoverButtonTitle(
								true,
								firstIndex,
								isStackedHorizontally
						  )
						: firstBlockTitle
				}
				isDisabled={ isFirst }
				onClick={ onMoveUp }
				icon={ getArrowIcon( true, isStackedHorizontally ) }
				extraProps={ { hint: backwardButtonHint } }
			/>

			<ToolbarButton
				title={
					! isLast
						? getMoverButtonTitle(
								false,
								firstIndex,
								isStackedHorizontally
						  )
						: lastBlockTitle
				}
				isDisabled={ isLast }
				onClick={ onMoveDown }
				icon={ getArrowIcon( false, isStackedHorizontally ) }
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
