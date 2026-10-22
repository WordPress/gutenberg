import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { fullscreen } from '@wordpress/icons';
import { store as blockEditorStore } from '../../store';
import BlockHTMLModal from './modal';
import type { BlockEditVisuallyButtonProps } from './types';

export default function BlockEditVisuallyButton( {
	clientIds,
}: BlockEditVisuallyButtonProps ) {
	// Edit visually only works for single block selection.
	const clientId = clientIds.length === 1 ? clientIds[ 0 ] : undefined;
	const canEditVisually = useSelect(
		( select ) =>
			!! clientId &&
			select( blockEditorStore ).getBlockMode( clientId ) === 'html',
		[ clientId ]
	);
	const { toggleBlockMode } = useDispatch( blockEditorStore );
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	if ( ! canEditVisually ) {
		return null;
	}

	return (
		<>
			<ToolbarGroup>
				<ToolbarButton
					onClick={ () => {
						// The button only renders for a single block.
						toggleBlockMode( clientId! );
					} }
				>
					{ __( 'Edit visually' ) }
				</ToolbarButton>
				<ToolbarButton
					icon={ fullscreen }
					label={ __( 'Expand HTML editor' ) }
					onClick={ () => setIsModalOpen( true ) }
					aria-expanded={ isModalOpen }
					aria-haspopup="dialog"
				/>
			</ToolbarGroup>
			{ isModalOpen && (
				<BlockHTMLModal
					// The button only renders for a single block.
					clientId={ clientId! }
					onClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}
