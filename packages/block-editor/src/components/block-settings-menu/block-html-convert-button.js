/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { rawHandler, getBlockContent } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function BlockHTMLConvertButton( { clientId } ) {
	const block = useSelect(
		( select ) => select( blockEditorStore ).getBlock( clientId ),
		[ clientId ]
	);
	const { replaceBlocks } = useDispatch( blockEditorStore );

	if ( ! block || block.name !== 'core/html' ) {
		return null;
	}

	return (
		<MenuItem
			onClick={ () =>
				replaceBlocks(
					clientId,
					rawHandler( { HTML: getBlockContent( block ) } )
				)
			}
		>
			{ __( 'Convert to Blocks' ) }
		</MenuItem>
	);
}

export default BlockHTMLConvertButton;
