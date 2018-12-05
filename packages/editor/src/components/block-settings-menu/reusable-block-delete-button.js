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

export function ReusableBlockDeleteButton( { id, isDisabled, onDelete } ) {
	if ( ! id ) {
		return null;
	}

	return (
		<MenuItem
			className="editor-block-settings-menu__control"
			icon="no"
			disabled={ isDisabled }
			onClick={ () => onDelete( id ) }
		>
			{ __( 'Remove from Reusable Blocks' ) }
		</MenuItem>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			getBlock,
			__experimentalGetReusableBlock: getReusableBlock,
		} = select( 'core/editor' );
		const { canUser } = select( 'core' );

		const block = getBlock( clientId );

		const id = block && isReusableBlock( block ) ? block.attributes.ref : null;
		return {
			id,
			isDisabled: !! id && (
				getReusableBlock( id ).isTemporary || ! canUser( 'delete', 'blocks', id )
			),
		};
	} ),
	withDispatch( ( dispatch, { onToggle = noop } ) => {
		const {
			__experimentalDeleteReusableBlock: deleteReusableBlock,
		} = dispatch( 'core/editor' );

		return {
			onDelete( id ) {
				// TODO: Make this a <Confirm /> component or similar
				// eslint-disable-next-line no-alert
				const hasConfirmed = window.confirm( __(
					'Are you sure you want to delete this Reusable Block?\n\n' +
					'It will be permanently removed from all posts and pages that use it.'
				) );

				if ( hasConfirmed ) {
					deleteReusableBlock( id );
					onToggle();
				}
			},
		};
	} ),
] )( ReusableBlockDeleteButton );
