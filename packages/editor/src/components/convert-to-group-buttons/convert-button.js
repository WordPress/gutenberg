/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

export function ConvertToGroupButton( {
	onConvertToGroup,
	isVisible = true,
} ) {
	if ( ! isVisible ) {
		return null;
	}

	return (
		<Fragment>
			<MenuItem
				className="editor-block-settings-menu__control block-editor-block-settings-menu__control"
				icon="controls-repeat"
				onClick={ onConvertToGroup }
			>
				{ __( 'Group' ) }
			</MenuItem>
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select, { clientIds } ) => {
		const {
			getBlocksByClientId,
			getBlockRootClientId,
		} = select( 'core/block-editor' );

		const blocksToGroup = getBlocksByClientId( clientIds );

		const isSingleContainerBlock = blocksToGroup.length === 1 && blocksToGroup[ 0 ].name === 'core/group';

		const isGroupable = (
			blocksToGroup.length &&
			blocksToGroup[ 0 ] &&
			! isSingleContainerBlock
		);

		// Define any edge cases here
		const isVisible = isGroupable;

		return {
			isVisible,
			blocksToGroup,
			getBlockRootClientId,
		};
	} ),
	withDispatch( ( dispatch, { clientIds, onToggle = noop, blocksToGroup = [], getBlockRootClientId } ) => {
		const {
			insertBlock,
			moveBlockToPosition,
		} = dispatch( 'core/block-editor' );

		return {
			onConvertToGroup() {
				if ( ! blocksToGroup.length ) {
					return;
				}

				const wrapperBlock = createBlock( 'core/group', {
					backgroundColor: 'lighter-blue',
				} );

				const firstBlockIndex = blocksToGroup[ 0 ].clientId;

				insertBlock( wrapperBlock, firstBlockIndex );

				clientIds.forEach( ( blockClientId ) => {
					moveBlockToPosition( blockClientId, getBlockRootClientId( blockClientId ), wrapperBlock.clientId );
				} );
				onToggle();
			},
		};
	} ),
] )( ConvertToGroupButton );
