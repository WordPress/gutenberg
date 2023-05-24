/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Modal } from '@wordpress/components';
import {
	EntitiesSavedStates,
} from '@wordpress/editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { NavigableRegion } from '@wordpress/interface';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../private-apis';
import { useActivateTheme } from '../../utils/use-activate-theme';

function isPreviewingTheme() {
	return (
		window?.__experimentalEnableThemePreviews &&
		getQueryArg( window.location.href, 'theme_preview' ) !== undefined
	);
}

function currentlyPreviewingTheme() {
	if ( isPreviewingTheme() ) {
		return getQueryArg( window.location.href, 'theme_preview' );
	}
	return null;
}

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

	const _EntitiesSavedStates = () => {
		const { getTheme } = useSelect( coreStore );
		const theme = getTheme( currentlyPreviewingTheme() );

		const [ isDirty, setIsDirty ] = useState( false );
		const saveEnabled = isPreviewingTheme() || isDirty;

		let activateSaveLabel;
		if ( isPreviewingTheme() && isDirty ) {
			activateSaveLabel = __( 'Activate & Save' );
		} else if ( isPreviewingTheme() ) {
			activateSaveLabel = __( 'Activate' );
		} else {
			activateSaveLabel = undefined;
		}

		const additionalPrompt = (
			<p>
				{ sprintf(
					'Saving your changes will change your active theme to  %1$s.',
					theme?.name?.rendered
				) }
			</p>
		);

		const onSave = async ( values ) => {
			await activateTheme();
			return values;
		};

		return window?.__experimentalEnableThemePreviews ? (
				<EntitiesSavedStates {...{
					additionalPrompt,
					close: onClose,
					isDirty,
					onSave,
					saveEnabled,
					saveLabel: activateSaveLabel,
					setIsDirty,
				}} />
		) : (
			<EntitiesSavedStates close={ onClose } />
		);
	};

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
				<_EntitiesSavedStates />
			</Modal>
		) : null;
	}

	return (
		<NavigableRegion
			className={ classnames( 'edit-site-layout__actions', {
				'is-entity-save-view-open': isSaveViewOpen,
			} ) }
			ariaLabel={ __( 'Save panel' ) }
		>
			{ isSaveViewOpen ? (
				<_EntitiesSavedStates />
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
