/**
 * WordPress dependencies
 */
import { Button, Modal } from '@wordpress/components';
import { EntitiesSavedStates } from '@wordpress/editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { NavigableRegion } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../experiments';

export default function SavePanel() {
	const { isSaveViewOpen, canvasMode } = useSelect( ( select ) => {
		const { isSaveViewOpened, getCanvasMode } = unlock(
			select( editSiteStore )
		);

		// The currently selected entity to display.
		// Typically template or template part in the site editor.
		return {
			isSaveViewOpen: isSaveViewOpened(),
			canvasMode: getCanvasMode(),
		};
	}, [] );
	const { setIsSaveViewOpened } = useDispatch( editSiteStore );
	const onClose = () => setIsSaveViewOpened( false );

	if ( canvasMode === 'view' ) {
		return isSaveViewOpen ? (
			<Modal
				className="edit-site-save-panel__modal"
				onRequestClose={ onClose }
				__experimentalHideHeader
			>
				<EntitiesSavedStates close={ onClose } />
			</Modal>
		) : null;
	}

	return (
		<NavigableRegion
			className="edit-site-layout__actions"
			ariaLabel={ __( 'Save sidebar' ) }
		>
			{ isSaveViewOpen ? (
				<EntitiesSavedStates close={ onClose } />
			) : (
				<div className="edit-site-editor__toggle-save-panel">
					<Button
						variant="secondary"
						className="edit-site-editor__toggle-save-panel-button"
						onClick={ () => setIsSaveViewOpened( true ) }
						aria-expanded={ false }
					>
						{ __( 'Open save panel' ) }
					</Button>
				</div>
			) }
		</NavigableRegion>
	);
}
