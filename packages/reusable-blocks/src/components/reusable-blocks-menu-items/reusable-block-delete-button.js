/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isReusableBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { STORE_KEY } from '../../store/constants';

function ReusableBlockDeleteButton( { clientId } ) {
	const { isVisible, isDisabled, block } = useSelect(
		( select ) => {
			const { getBlock } = select( 'core/block-editor' );
			const { canUser } = select( 'core' );
			const blockObj = getBlock( clientId );

			const reusableBlock =
				blockObj && isReusableBlock( blockObj )
					? select( 'core' ).getEntityRecord(
							'postType',
							'wp_block',
							blockObj.attributes.ref
					  )
					: null;

			return {
				block: blockObj,
				isVisible:
					!! reusableBlock &&
					( reusableBlock.isTemporary ||
						!! canUser( 'delete', 'blocks', reusableBlock.id ) ),
				isDisabled: reusableBlock && reusableBlock.isTemporary,
			};
		},
		[ clientId ]
	);

	const {
		__experimentalDeleteReusableBlock: deleteReusableBlock,
	} = useDispatch( STORE_KEY );

	const { createSuccessNotice, createErrorNotice } = useDispatch(
		'core/notices'
	);
	const onDelete = useCallback(
		async function () {
			try {
				await deleteReusableBlock( block.attributes.ref );
				createSuccessNotice( __( 'Block deleted.' ), {
					type: 'snackbar',
				} );
			} catch ( error ) {
				createErrorNotice( error.message, {
					type: 'snackbar',
				} );
			}
		},
		[ block ]
	);

	if ( ! isVisible ) {
		return null;
	}

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<MenuItem
					disabled={ isDisabled }
					onClick={ () => {
						// eslint-disable-next-line no-alert
						const hasConfirmed = window.confirm(
							// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
							__(
								'Are you sure you want to delete this Reusable Block?\n\n' +
									'It will be permanently removed from all posts and pages that use it.'
							)
						);
						if ( hasConfirmed ) {
							onDelete();
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

export default ReusableBlockDeleteButton;
