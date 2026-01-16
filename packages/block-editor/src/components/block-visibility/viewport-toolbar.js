/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useRef, useEffect, useState } from '@wordpress/element';
import { seen, unseen } from '@wordpress/icons';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { BlockVisibilityModal } from './';
import { unlock } from '../../lock-unlock';

export default function BlockVisibilityViewportToolbar( { clientIds } ) {
	const hasBlockVisibilityButtonShownRef = useRef( false );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { canToggleBlockVisibility, areBlocksHiddenAnywhere } = useSelect(
		( select ) => {
			const {
				getBlocksByClientId,
				getBlockName,
				areBlocksHiddenAnywhere: _areBlocksHiddenAnywhere,
			} = unlock( select( blockEditorStore ) );
			const _blocks = getBlocksByClientId( clientIds );
			return {
				canToggleBlockVisibility: _blocks.every( ( { clientId } ) =>
					hasBlockSupport(
						getBlockName( clientId ),
						'visibility',
						true
					)
				),
				areBlocksHiddenAnywhere: _areBlocksHiddenAnywhere( clientIds ),
			};
		},

		[ clientIds ]
	);

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

	return (
		<>
			<ToolbarGroup className="block-editor-block-visibility-toolbar">
				<ToolbarButton
					disabled={ ! canToggleBlockVisibility }
					icon={ areBlocksHiddenAnywhere ? unseen : seen }
					label={
						areBlocksHiddenAnywhere
							? __( 'Hidden' )
							: __( 'Visible' )
					}
					onClick={ () => setIsModalOpen( true ) }
					aria-expanded={ isModalOpen }
					aria-haspopup={ ! isModalOpen ? 'dialog' : undefined }
				/>
			</ToolbarGroup>
			{ isModalOpen && (
				<BlockVisibilityModal
					clientIds={ clientIds }
					onClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}
