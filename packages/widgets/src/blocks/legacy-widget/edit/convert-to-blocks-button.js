/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { convertLegacyWidgetToBlocks } from '../conversion';

export default function ConvertToBlocksButton( {
	clientId,
	idBase,
	rawInstance,
} ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );

	return (
		<ToolbarButton
			onClick={ () => {
				replaceBlocks(
					clientId,
					convertLegacyWidgetToBlocks( idBase, rawInstance )
				);
			} }
		>
			{ __( 'Convert to blocks' ) }
		</ToolbarButton>
	);
}
