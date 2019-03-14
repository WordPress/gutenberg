/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isReusableBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';

export function ReusableBlockDeleteButton( { isVisible, isDisabled, onDelete } ) {
	if ( ! isVisible ) {
		return null;
	}

	return (
		<MenuItem
			className="editor-block-settings-menu__control block-editor-block-settings-menu__control"
			icon="no"
			disabled={ isDisabled }
			onClick={ () => onDelete() }
		>
			{ __( 'Remove from Reusable Blocks' ) }
		</MenuItem>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlock } = select( 'core/block-editor' );
		const { canUser } = select( 'core' );
		const { __experimentalGetReusableBlock: getReusableBlock } = select( 'core/editor' );
		const block = getBlock( clientId );

		const reusableBlock = block && isReusableBlock( block ) ?
			getReusableBlock( block.attributes.ref ) :
			null;

		return {
			isVisible: !! reusableBlock && !! canUser( 'delete', 'blocks', reusableBlock.id ),
			isDisabled: reusableBlock && reusableBlock.isTemporary,
		};
	} ),
	withDispatch( ( dispatch, { clientId, onToggle = noop }, { select } ) => {
		const {
			__experimentalDeleteReusableBlock: deleteReusableBlock,
		} = dispatch( 'core/editor' );
		const { getBlock } = select( 'core/block-editor' );

		return {
			onDelete() {
				// TODO: Make this a <Confirm /> component or similar
				// eslint-disable-next-line no-alert
				const hasConfirmed = window.confirm( __(
					'Are you sure you want to delete this Reusable Block?\n\n' +
					'It will be permanently removed from all posts and pages that use it.'
				) );

				if ( hasConfirmed ) {
					const block = getBlock( clientId );
					deleteReusableBlock( block.attributes.ref );
					onToggle();
				}
			},
		};
	} ),
] )( ReusableBlockDeleteButton );
