/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function ConvertToRegularBlocks( { clientId } ) {
	const { innerBlocks } = useSelect(
		( select ) =>
			select( 'core/block-editor' ).__unstableGetBlockWithBlockTree(
				clientId
			),
		[ clientId ]
	);
	const { replaceBlocks } = useDispatch( 'core/block-editor' );

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<MenuItem
					onClick={ () => {
						replaceBlocks( clientId, innerBlocks );
						onClose();
					} }
				>
					{ __( 'Convert to regular blocks' ) }
				</MenuItem>
			) }
		</BlockSettingsMenuControls>
	);
}
