import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useMemo } from '@wordpress/element';
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

const NO_META_BOXES = Object.freeze( [] );

/**
 * Initializes WordPress `postboxes` script and the logic for saving meta boxes.
 *
 * @param { boolean } enabled
 */
export const useMetaBoxInitialization = ( enabled ) => {
	const {
		isEnabledAndEditorReady,
		isCollaborationEnabled,
		metaBoxes,
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
				metaBoxes: enabled
					? select( editPostStore ).getAllMetaBoxes()
					: NO_META_BOXES,
				hasActiveMetaBoxes:
					enabled && select( editPostStore ).hasMetaBoxes(),
			};
		},
		[ enabled ]
	);

	const hasIncompatibleMetaBoxes = useMemo(
		() => metaBoxes.some( ( metaBox ) => ! metaBox.__rtc_compatible ),
		[ metaBoxes ]
	);

	/*
	 * Named so the lock-out can say which plugins to look at rather than only
	 * that something is incompatible. The plugin name is resolved server side;
	 * the meta box title stands in when it cannot be. One plugin can register
	 * several meta boxes, so names are deduplicated.
	 */
	const incompatiblePlugins = useMemo(
		() => [
			...new Set(
				metaBoxes
					.filter( ( metaBox ) => ! metaBox.__rtc_compatible )
					.map( ( metaBox ) => metaBox.plugin || metaBox.title )
					.filter( Boolean )
			),
		],
		[ metaBoxes ]
	);
	const { setCollaborationSupported } = unlock( useDispatch( coreStore ) );
	const { updateEditorSettings } = useDispatch( editorStore );
	const { initializeMetaBoxes } = useDispatch( editPostStore );

	// The effect has to rerun when the editor is ready because initializeMetaBoxes
	// will noop until then.
	useEffect( () => {
		if ( isEnabledAndEditorReady ) {
			initializeMetaBoxes();

			// Disable real-time collaboration when incompatible meta boxes are detected.
			if ( isCollaborationEnabled && hasIncompatibleMetaBoxes ) {
				setCollaborationSupported( false, incompatiblePlugins );
			}

			// Classic meta box values are saved through a separate
			// admin-ajax submission that the in-editor revisions restore
			// does not drive, so visual revisions would silently leave
			// them untouched. Fall back to the classic revision.php
			// admin screen instead.
			if ( hasActiveMetaBoxes ) {
				updateEditorSettings( { disableVisualRevisions: true } );
			}
		}
	}, [
		isEnabledAndEditorReady,
		initializeMetaBoxes,
		isCollaborationEnabled,
		setCollaborationSupported,
		hasIncompatibleMetaBoxes,
		incompatiblePlugins,
		hasActiveMetaBoxes,
		updateEditorSettings,
	] );
};
