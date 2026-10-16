import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
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

	if ( ! canEditVisually ) {
		return null;
	}

	return (
		<ToolbarGroup>
			<ToolbarButton
				onClick={ () => {
					// The button only renders for a single block.
					toggleBlockMode( clientId! );
				} }
			>
				{ __( 'Edit visually' ) }
			</ToolbarButton>
		</ToolbarGroup>
	);
}
