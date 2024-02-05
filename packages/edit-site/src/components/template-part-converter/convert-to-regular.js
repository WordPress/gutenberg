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

const {
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

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
		// TODO: check if this is used in other legacy dropdown menus
		<DropdownMenuItem
			onClick={ () => {
				replaceBlocks( clientId, getBlocks( clientId ) );
			} }
		>
			<DropdownMenuItemLabel>{ __( 'Detach' ) }</DropdownMenuItemLabel>
		</DropdownMenuItem>
	);
}
