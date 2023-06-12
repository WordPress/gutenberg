/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { DropdownMenuItemV2 } = unlock( componentsPrivateApis );

export default function ConvertToRegularBlocks( { clientId } ) {
	const { getBlocks } = useSelect( blockEditorStore );
	const { replaceBlocks } = useDispatch( blockEditorStore );

	const canRemove = useSelect(
		( select ) => select( blockEditorStore ).canRemoveBlock( clientId ),
		[ clientId ]
	);

	if ( ! canRemove ) {
		return null;
	}

	return (
		/* TODO: check if this used in other legacy dropdown menus */
		<DropdownMenuItemV2
			onSelect={ () => {
				replaceBlocks( clientId, getBlocks( clientId ) );
			} }
		>
			{ __( 'Detach blocks from template part' ) }
		</DropdownMenuItemV2>
	);
}
