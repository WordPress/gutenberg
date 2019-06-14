/**
 * External dependencies
 */
import { first, last, partial, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';

const BlockMover = ( {
	isFirst,
	isLast,
	onMoveDown,
	onMoveUp,
} ) => (
	<>
		<ToolbarButton
			accessibilityLabel={ __( 'Move up' ) }
			label={ __( 'Move up' ) }
			isDisabled={ isFirst }
			onClick={ onMoveUp }
			icon="arrow-up-alt"
		/>

		<ToolbarButton
			label={ __( 'Move down' ) }
			isDisabled={ isLast }
			onClick={ onMoveDown }
			icon="arrow-down-alt"
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
