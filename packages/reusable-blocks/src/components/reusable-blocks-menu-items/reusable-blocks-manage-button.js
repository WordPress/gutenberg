/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isReusableBlock } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import { addQueryArgs } from '@wordpress/url';

function ReusableBlocksManageButton( { clientId } ) {
	const { isVisible } = useSelect(
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
				isVisible:
					!! reusableBlock &&
					!! canUser( 'update', 'blocks', reusableBlock.id ),
			};
		},
		[ clientId ]
	);

	if ( ! isVisible ) {
		return null;
	}

	return (
		<BlockSettingsMenuControls>
			<MenuItem
				onClick={ () => {
					window.location = addQueryArgs( 'edit.php', {
						post_type: 'wp_block',
					} );
				} }
			>
				{ __( 'Manage Reusable blocks' ) }
			</MenuItem>
		</BlockSettingsMenuControls>
	);
}

export default ReusableBlocksManageButton;
