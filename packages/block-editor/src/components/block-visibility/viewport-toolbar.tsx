import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { seen, unseen } from '@wordpress/icons';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useSettings } from '../use-settings';
import type { TreeBlock } from '../../store/types';
import type { BlockVisibilityClientIdsProps } from './types';

export default function BlockVisibilityViewportToolbar( {
	clientIds,
}: BlockVisibilityClientIdsProps ) {
	const [ blockVisibility ] = useSettings( 'blockVisibility.allowEditing' );
	const { canToggleBlockVisibility, areBlocksHiddenAnywhere } = useSelect(
		( select ) => {
			const { getBlocksByClientId, getBlockName, isBlockHiddenAnywhere } =
				unlock( select( blockEditorStore ) );
			const _blocks = getBlocksByClientId( clientIds );
			return {
				canToggleBlockVisibility: _blocks.every(
					( { clientId }: TreeBlock ) =>
						hasBlockSupport(
							getBlockName( clientId ),
							'visibility',
							true
						)
				),
				areBlocksHiddenAnywhere: clientIds?.every( ( clientId ) =>
					isBlockHiddenAnywhere( clientId )
				),
			};
		},

		[ clientIds ]
	);
	const blockEditorDispatch = useDispatch( blockEditorStore );
	const [ hasButtonShown, setHasButtonShown ] = useState(
		areBlocksHiddenAnywhere
	);

	// Once shown, keep the button until the toolbar remounts. Removing it
	// early would lose the focus the modal needs to return to it.
	if ( areBlocksHiddenAnywhere && ! hasButtonShown ) {
		setHasButtonShown( true );
	}

	if ( blockVisibility === false ) {
		return null;
	}

	if ( ! hasButtonShown ) {
		return null;
	}

	const { showViewportModal } = unlock( blockEditorDispatch );

	return (
		<ToolbarGroup className="block-editor-block-visibility-toolbar">
			<ToolbarButton
				disabled={ ! canToggleBlockVisibility }
				icon={ areBlocksHiddenAnywhere ? unseen : seen }
				label={
					areBlocksHiddenAnywhere ? __( 'Hidden' ) : __( 'Visible' )
				}
				onClick={ () => showViewportModal( clientIds ) }
				aria-haspopup="dialog"
			/>
		</ToolbarGroup>
	);
}
