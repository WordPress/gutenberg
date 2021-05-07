/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isReusableBlock } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { addQueryArgs } from '@wordpress/url';

function ReusableBlocksManageButton( { clientId } ) {
	const { isVisible } = useSelect(
		( select ) => {
			const { getBlock } = select( blockEditorStore );
			const { canUser } = select( 'core' );
			const reusableBlock = getBlock( clientId );

			return {
				isVisible:
					!! reusableBlock &&
					isReusableBlock( reusableBlock ) &&
					!! canUser(
						'update',
						'blocks',
						reusableBlock.attributes.ref
					),
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
				href={ addQueryArgs( 'edit.php', { post_type: 'wp_block' } ) }
			>
				{ __( 'Manage Reusable blocks' ) }
			</MenuItem>
		</BlockSettingsMenuControls>
	);
}

export default ReusableBlocksManageButton;
