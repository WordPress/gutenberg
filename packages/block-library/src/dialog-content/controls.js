/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

export function Toolbar( { openDialog, closeDialog, isOpen, clientId } ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const { rootClientId } = useSelect(
		( select ) => {
			return {
				rootClientId:
					select( blockEditorStore ).getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);
	const buttonLabel = useMemo(
		() => ( isOpen ? __( 'Close dialog' ) : __( 'Edit dialog' ) ),
		[ isOpen ]
	);

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					label={ buttonLabel }
					onClick={ () => {
						if ( isOpen ) {
							selectBlock( rootClientId );
							closeDialog();
						} else {
							openDialog();
						}
					} }
				>
					{ buttonLabel }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
