/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { pasteHandler, serialize } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { removep } from '@wordpress/autop';

const ConvertToBlocksButton = ( { clientId } ) => {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const block = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlock( clientId );
		},
		[ clientId ]
	);

	return (
		<ToolbarButton
			onClick={ () => {
				const plainContent = removep( serialize( block ) );
				replaceBlocks(
					block.clientId,
					pasteHandler( {
						HTML: plainContent,
						plainText: plainContent,
						mode: 'BLOCKS',
					} )
				);
			} }
		>
			{ __( 'Convert to blocks' ) }
		</ToolbarButton>
	);
};

export default ConvertToBlocksButton;
