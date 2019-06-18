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

const BlockMover = ( {
	isFirst,
	isLast,
	onMoveDown,
	onMoveUp,
	firstIndex,
} ) => (
	<>
		<ToolbarButton
			title={ ! isFirst ?
				sprintf(
					/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
					__( 'Move block up from row %1$s to row %2$s' ),
					firstIndex + 1,
					firstIndex
				) :
				__( 'Move block up' )
			}
			isDisabled={ isFirst }
			onClick={ onMoveUp }
			icon="arrow-up-alt"
			extraProps={ { hint: __( 'Double tap to move the block up' ) } }
		/>

		<ToolbarButton
			title={ ! isLast ?
				sprintf(
					/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
					__( 'Move block down from row %1$s to row %2$s' ),
					firstIndex + 1,
					firstIndex + 2
				) :
				__( 'Move block down' )
			}
			isDisabled={ isLast }
			onClick={ onMoveDown }
			icon="arrow-down-alt"
			extraProps={ { hint: __( 'Double tap to move the block down' ) } }
		/>
	</>
);

export default compose(
	withSelect( ( select, { clientIds } ) => {
		const { getBlockIndex, getBlockRootClientId, getBlockOrder } = select( 'core/block-editor' );
		const normalizedClientIds = castArray( clientIds );
		const firstClientId = first( normalizedClientIds );
		const rootClientId = getBlockRootClientId( first( normalizedClientIds ) );
		const blockOrder = getBlockOrder( rootClientId );
		const firstIndex = getBlockIndex( firstClientId, rootClientId );
		const lastIndex = getBlockIndex( last( normalizedClientIds ), rootClientId );

		return {
			firstIndex,
			isFirst: firstIndex === 0,
			isLast: lastIndex === blockOrder.length - 1,
		};
	} ),
	withDispatch( ( dispatch, { clientIds, rootClientId } ) => {
		const { moveBlocksDown, moveBlocksUp } = dispatch( 'core/block-editor' );
		return {
			onMoveDown: partial( moveBlocksDown, clientIds, rootClientId ),
			onMoveUp: partial( moveBlocksUp, clientIds, rootClientId ),
		};
	} ),
	withInstanceId,
)( BlockMover );
