/**
 * WordPress dependencies
 */
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Initializes WordPress `postboxes` script and the logic for saving meta boxes.
 *
 * @param { boolean } enabled
 */
export const useMetaBoxInitialization = ( enabled ) => {
	const {
		isEnabledAndEditorReady,
		isCollaborationEnabled,
		hasIncompatibleMetaBoxes,
		hasActiveMetaBoxes,
	} = useSelect(
		( select ) => {
			const {
				__unstableIsEditorReady,
				isCollaborationEnabledForCurrentPost,
			} = unlock( select( editorStore ) );
			return {
				isEnabledAndEditorReady: enabled && __unstableIsEditorReady(),
				isCollaborationEnabled: isCollaborationEnabledForCurrentPost(),
				hasIncompatibleMetaBoxes: enabled
					? select( editPostStore )
							.getAllMetaBoxes()
							.some( ( metaBox ) => ! metaBox.__rtc_compatible )
					: false,
				hasActiveMetaBoxes:
					enabled && select( editPostStore ).hasMetaBoxes(),
			};
		},
		[ enabled ]
	);
	const { setCollaborationSupported } = unlock( useDispatch( coreStore ) );
	const { updateEditorSettings } = useDispatch( editorStore );
	const { initializeMetaBoxes } = useDispatch( editPostStore );
	const registry = useRegistry();

	// The effect has to rerun when the editor is ready because initializeMetaBoxes
	// will noop until then.
	useEffect( () => {
		if ( isEnabledAndEditorReady ) {
			initializeMetaBoxes();

			// Disable real-time collaboration when incompatible meta boxes are detected.
			if ( isCollaborationEnabled && hasIncompatibleMetaBoxes ) {
				setCollaborationSupported( false );
			}

			// Classic meta box values are saved through a separate
			// admin-ajax submission that the in-editor revisions restore
			// does not drive, so visual revisions would silently leave
			// them untouched. Fall back to the classic revision.php
			// admin screen instead.
			if ( hasActiveMetaBoxes ) {
				updateEditorSettings( { disableVisualRevisions: true } );

				// The flag arrives after the editor is ready, so revisions
				// mode may already be active (deep link or a click that
				// beat the flag). Honor the intent on the classic screen.
				const revisionId = unlock(
					registry.select( editorStore )
				).getCurrentRevisionId();
				if ( revisionId ) {
					window.location.href = addQueryArgs( 'revision.php', {
						revision: revisionId,
					} );
				}
			}
		}
	}, [
		isEnabledAndEditorReady,
		initializeMetaBoxes,
		isCollaborationEnabled,
		setCollaborationSupported,
		hasIncompatibleMetaBoxes,
		hasActiveMetaBoxes,
		updateEditorSettings,
		registry,
	] );
};
