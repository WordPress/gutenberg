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
	useEntitiesSavedStatesIsDirty,
	privateApis,
} from '@wordpress/editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { NavigableRegion } from '@wordpress/interface';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useActivateTheme } from '../../utils/use-activate-theme';
import {
	currentlyPreviewingTheme,
	isPreviewingTheme,
} from '../../utils/is-previewing-theme';

const { EntitiesSavedStatesExtensible } = unlock( privateApis );

const EntitiesSavedStatesForPreview = ( { onClose } ) => {
	const isDirtyProps = useEntitiesSavedStatesIsDirty();
	let activateSaveLabel;
	if ( isDirtyProps.isDirty ) {
		activateSaveLabel = __( 'Activate & Save' );
	} else {
		activateSaveLabel = __( 'Activate' );
	}

	const { getTheme } = useSelect( coreStore );
	const theme = getTheme( currentlyPreviewingTheme() );
	const additionalPrompt = (
		<p>
			{ sprintf(
				'Saving your changes will change your active theme to  %1$s.',
				theme?.name?.rendered
			) }
		</p>
	);

	const activateTheme = useActivateTheme();
	const onSave = async ( values ) => {
		await activateTheme();
		return values;
	};

	return (
		<EntitiesSavedStatesExtensible
			{ ...{
				...isDirtyProps,
				additionalPrompt,
				close: onClose,
				onSave,
				saveEnabled: true,
				saveLabel: activateSaveLabel,
			} }
		/>
	);
};

const _EntitiesSavedStates = ( { onClose } ) => {
	if ( isPreviewingTheme() ) {
		return <EntitiesSavedStatesForPreview onClose={ onClose } />;
	}
	return <EntitiesSavedStates close={ onClose } />;
};

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
				contentLabel={ __(
					'Save site, content, and template changes'
				) }
			>
				<_EntitiesSavedStates onClose={ onClose } />
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
				<_EntitiesSavedStates onClose={ onClose } />
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
