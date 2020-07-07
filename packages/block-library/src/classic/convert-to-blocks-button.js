/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { rawHandler, serialize } from '@wordpress/blocks';

const ConvertToBlocksButton = ( { clientId } ) => {
	const { replaceBlocks } = useDispatch( 'core/block-editor' );
	const block = useSelect(
		( select ) => {
			return select( 'core/block-editor' ).getBlock( clientId );
		},
		[ clientId ]
	);

	return (
		<ToolbarButton
			onClick={ () =>
				replaceBlocks(
					block.clientId,
					rawHandler( { HTML: serialize( block ) } )
				)
			}
		>
			{ __( 'Convert to blocks' ) }
		</ToolbarButton>
	);
};

export default ConvertToBlocksButton;
