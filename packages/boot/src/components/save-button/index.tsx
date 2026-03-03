/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { _n, __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { displayShortcut, rawShortcut } from '@wordpress/keycodes';
import { check } from '@wordpress/icons';
import { EntitiesSavedStates } from '@wordpress/editor';
import { Button, Modal, Tooltip } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import useSaveShortcut from '../save-panel/use-save-shortcut';

export default function SaveButton() {
	const [ isSaveViewOpen, setIsSaveViewOpened ] = useState( false );
	const { isSaving, dirtyEntityRecordsCount } = useSelect( ( select ) => {
		const { isSavingEntityRecord, __experimentalGetDirtyEntityRecords } =
			select( coreStore );
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		return {
			isSaving: dirtyEntityRecords.some( ( record ) =>
				isSavingEntityRecord( record.kind, record.name, record.key )
			),
			dirtyEntityRecordsCount: dirtyEntityRecords.length,
		};
	}, [] );
	const [ showSavedState, setShowSavedState ] = useState( false );

	useEffect( () => {
		if ( isSaving ) {
			// Proactively expect to show saved state. This is done once save
			// starts to avoid race condition where setting it after would cause
			// the button to be unmounted before state is updated.
			setShowSavedState( true );
		}
	}, [ isSaving ] );

	const hasChanges = dirtyEntityRecordsCount > 0;

	// Handle save failure case: If we were showing saved state but saving
	// failed, reset to show changes again.
	useEffect( () => {
		if ( ! isSaving && hasChanges ) {
			setShowSavedState( false );
		}
	}, [ isSaving, hasChanges ] );

	function hideSavedState() {
		if ( showSavedState ) {
			setShowSavedState( false );
		}
	}

	const shouldShowButton = hasChanges || showSavedState;

	useSaveShortcut( { openSavePanel: () => setIsSaveViewOpened( true ) } );

	if ( ! shouldShowButton ) {
		return null;
	}

	const isInSavedState = showSavedState && ! hasChanges;
	const disabled = isSaving || isInSavedState;

	const getLabel = () => {
		if ( isInSavedState ) {
			return __( 'Saved' );
		}
		return sprintf(
			// translators: %d: number of unsaved changes (number).
			_n(
				'Review %d change…',
				'Review %d changes…',
				dirtyEntityRecordsCount
			),
			dirtyEntityRecordsCount
		);
	};
	const label = getLabel();

	return (
		<>
			<Tooltip
				text={ hasChanges ? label : undefined }
				shortcut={ displayShortcut.primary( 's' ) }
			>
				<Button
					variant="primary"
					size="compact"
					onClick={ () => setIsSaveViewOpened( true ) }
					onBlur={ hideSavedState }
					disabled={ disabled }
					accessibleWhenDisabled
					isBusy={ isSaving }
					aria-keyshortcuts={ rawShortcut.primary( 's' ) }
					className="boot-save-button"
					icon={ isInSavedState ? check : undefined }
				>
					{ label }
				</Button>
			</Tooltip>
			{ isSaveViewOpen && (
				<Modal
					title={ __( 'Review changes' ) }
					onRequestClose={ () => setIsSaveViewOpened( false ) }
					size="small"
				>
					<EntitiesSavedStates
						close={ () => setIsSaveViewOpened( false ) }
						variant="inline"
					/>
				</Modal>
			) }
		</>
	);
}
