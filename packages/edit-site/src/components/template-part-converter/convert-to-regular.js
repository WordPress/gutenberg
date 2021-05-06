/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function ConvertToRegularBlocks( { clientId } ) {
	const { innerBlocks } = useSelect(
		( select ) =>
			select( blockEditorStore ).__unstableGetBlockWithBlockTree(
				clientId
			),
		[ clientId ]
	);
	const { replaceBlocks } = useDispatch( blockEditorStore );

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<MenuItem
					onClick={ () => {
						replaceBlocks( clientId, innerBlocks );
						onClose();
					} }
				>
					{ __( 'Detach blocks from template part' ) }
				</MenuItem>
			) }
		</BlockSettingsMenuControls>
	);
}
