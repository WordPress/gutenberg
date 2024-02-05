/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { rawHandler, getBlockContent } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

// TODO: check if this used in other legacy dropdown menus
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
		<DropdownMenuItem
			hideOnClick={ false }
			onClick={ () =>
				replaceBlocks(
					clientId,
					rawHandler( { HTML: getBlockContent( block ) } )
				)
			}
		>
			<DropdownMenuItemLabel>
				{ __( 'Convert to Blocks' ) }
			</DropdownMenuItemLabel>
		</DropdownMenuItem>
	);
}

export default BlockHTMLConvertButton;
