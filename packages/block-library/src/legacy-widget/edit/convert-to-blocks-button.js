/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { createBlock, rawHandler } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

export default function ConvertToBlocksButton( { clientId, rawInstance } ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );

	return (
		<ToolbarButton
			onClick={ () => {
				if ( rawInstance.title ) {
					replaceBlocks( clientId, [
						createBlock( 'core/heading', {
							content: rawInstance.title,
						} ),
						...rawHandler( { HTML: rawInstance.text } ),
					] );
				} else {
					replaceBlocks(
						clientId,
						rawHandler( { HTML: rawInstance.text } )
					);
				}
			} }
		>
			{ __( 'Convert to blocks' ) }
		</ToolbarButton>
	);
}
