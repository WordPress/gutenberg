/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isReusableBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';

export function ReusableBlockDeleteButton( {
	isVisible,
	isDisabled,
	onDelete,
} ) {
	if ( ! isVisible ) {
		return null;
	}

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<MenuItem
					disabled={ isDisabled }
					onClick={ () => {
						const hasConfirmed = onDelete();
						if ( hasConfirmed ) {
							onClose();
						}
					} }
				>
					{ __( 'Remove from Reusable blocks' ) }
				</MenuItem>
			) }
		</BlockSettingsMenuControls>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlock } = select( 'core/block-editor' );
		const { canUser } = select( 'core' );
		const { __experimentalGetReusableBlock: getReusableBlock } = select(
			'core/editor'
		);
		const block = getBlock( clientId );

		const reusableBlock =
			block && isReusableBlock( block )
				? getReusableBlock( block.attributes.ref )
				: null;

		return {
			isVisible:
				!! reusableBlock &&
				( reusableBlock.isTemporary ||
					!! canUser( 'delete', 'blocks', reusableBlock.id ) ),
			isDisabled: reusableBlock && reusableBlock.isTemporary,
		};
	} ),
	withDispatch( ( dispatch, { clientId }, { select } ) => {
		const {
			__experimentalDeleteReusableBlock: deleteReusableBlock,
		} = dispatch( 'core/editor' );
		const { getBlock } = select( 'core/block-editor' );

		return {
			onDelete() {
				// TODO: Make this a <Confirm /> component or similar
				// eslint-disable-next-line no-alert
				const hasConfirmed = window.confirm(
					// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
					__(
						'Are you sure you want to delete this Reusable Block?\n\n' +
							'It will be permanently removed from all posts and pages that use it.'
					)
				);

				if ( hasConfirmed ) {
					const block = getBlock( clientId );
					deleteReusableBlock( block.attributes.ref );
				}

				return hasConfirmed;
			},
		};
	} ),
] )( ReusableBlockDeleteButton );
