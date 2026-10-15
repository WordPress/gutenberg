import { __ } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { rawHandler, serialize } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

const ConvertToBlocksButton = ( { clientId } ) => {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const block = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlock( clientId );
		},
		[ clientId ]
	);
	const { canInsertBlockType, getBlockRootClientId } =
		useSelect( blockEditorStore );

	return (
		<ToolbarButton
			onClick={ () =>
				replaceBlocks(
					block.clientId,
					rawHandler( {
						HTML: serialize( block ),
						isBlockTypeAllowed: ( name ) =>
							canInsertBlockType(
								name,
								getBlockRootClientId( clientId )
							),
					} )
				)
			}
		>
			{ __( 'Convert to blocks' ) }
		</ToolbarButton>
	);
};

export default ConvertToBlocksButton;
