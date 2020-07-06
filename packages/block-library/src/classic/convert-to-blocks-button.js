/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { BlockControls } from '@wordpress/block-editor';
import { Toolbar, ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { rawHandler, serialize } from '@wordpress/blocks';

const ConvertToBlocksButton = ( { clientId } ) => {
	const { replaceBlocks } = useDispatch( 'core/block-editor' );
	const block = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getBlock( clientId );
	}, [ clientId ] );

	return (
		<BlockControls>
			<Toolbar>
				<ToolbarButton
					title={ __( 'Convert to Blocks' ) }
					onClick={ () =>
						replaceBlocks(
							block.clientId,
							rawHandler( { HTML: serialize( block ) } )
						)
					}
				>
					{ __( 'Convert to Blocks' ) }
				</ToolbarButton>
			</Toolbar>
		</BlockControls>
	);
};

export default ConvertToBlocksButton;
