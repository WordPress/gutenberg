/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useRef, useEffect } from '@wordpress/element';
import { seen, unseen } from '@wordpress/icons';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function BlockVisibilityViewportToolbar( { clientIds } ) {
	const hasBlockVisibilityButtonShownRef = useRef( false );
	const { canToggleBlockVisibility, areBlocksHiddenAnywhere } = useSelect(
		( select ) => {
			const { getBlocksByClientId, getBlockName, isBlockHiddenAnywhere } =
				unlock( select( blockEditorStore ) );
			const _blocks = getBlocksByClientId( clientIds );
			return {
				canToggleBlockVisibility: _blocks.every( ( { clientId } ) =>
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

	/*
	 * If the block visibility button has been shown, we don't want to
	 * remove it from the toolbar until the toolbar is rendered again
	 * without it. Removing it beforehand can cause focus loss issues.
	 * It needs to return focus from whence it came, and to do that,
	 * we need to leave the button in the toolbar.
	 */
	useEffect( () => {
		if ( areBlocksHiddenAnywhere ) {
			hasBlockVisibilityButtonShownRef.current = true;
		}
	}, [ areBlocksHiddenAnywhere ] );

	if (
		! areBlocksHiddenAnywhere &&
		! hasBlockVisibilityButtonShownRef.current
	) {
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
