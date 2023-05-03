/**
 * External dependencies
 */
import classnames from 'classnames';

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
import { unlock } from '../../private-apis';
import { useActivateTheme } from '../../utils/use-activate-theme';

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
	const activateTheme = useActivateTheme();
	const onClose = () => setIsSaveViewOpened( false );
	const onSave = async ( values ) => {
		await activateTheme();
		return values;
	};

	const entitySavedStates = window?.__experimentalEnableThemePreviews ? (
		<EntitiesSavedStates close={ onClose } onSave={ onSave } />
	) : (
		<EntitiesSavedStates close={ onClose } />
	);

	if ( canvasMode === 'view' ) {
		return isSaveViewOpen ? (
			<Modal
				className="edit-site-save-panel__modal"
				onRequestClose={ onClose }
				__experimentalHideHeader
				contentLabel={ __(
					'Save site, content, and template changes'
				) }
			>
				{ entitySavedStates }
			</Modal>
		) : null;
	}

	return (
		<NavigableRegion
			className={ classnames( 'edit-site-layout__actions', {
				'is-entity-save-view-open': isSaveViewOpen,
			} ) }
			ariaLabel={ __( 'Save sidebar' ) }
		>
			{ isSaveViewOpen ? (
				entitySavedStates
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
