import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { createBlock, rawHandler } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import type { RawInstance } from '../types';

interface ConvertToBlocksButtonProps {
	clientId: string;
	rawInstance: RawInstance;
}

export default function ConvertToBlocksButton( {
	clientId,
	rawInstance,
}: ConvertToBlocksButtonProps ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );

	return (
		<ToolbarButton
			onClick={ () => {
				if ( rawInstance.title ) {
					replaceBlocks( clientId, [
						createBlock( 'core/heading', {
							content: rawInstance.title,
						} ),
						...rawHandler( { HTML: rawInstance.text! } ),
					] );
				} else {
					replaceBlocks(
						clientId,
						rawHandler( { HTML: rawInstance.text! } )
					);
				}
			} }
		>
			{ __( 'Convert to blocks' ) }
		</ToolbarButton>
	);
}
