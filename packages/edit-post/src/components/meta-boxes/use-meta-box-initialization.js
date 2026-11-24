import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect } from '@wordpress/element';
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Checks whether any meta box is incompatible with real-time collaboration.
 *
 * Compatibility belongs to the meta box, not to the location it is shown in.
 * The compatibility flag is stored under the location the meta box was
 * registered in. When a user moves the meta box to another location, it is
 * listed a second time under the new location, without the flag. A meta box
 * is therefore compatible when any entry with its id has the flag.
 *
 * @param {Array} metaBoxes Meta boxes from all locations.
 *
 * @return {boolean} Whether at least one meta box is incompatible.
 */
function hasIncompatibleMetaBox( metaBoxes ) {
	const compatibleIds = new Set();

	for ( const metaBox of metaBoxes ) {
		if ( metaBox.__rtc_compatible ) {
			compatibleIds.add( metaBox.id );
		}
	}

	return metaBoxes.some( ( metaBox ) => ! compatibleIds.has( metaBox.id ) );
}

const META_BOX_SORTABLES = '.edit-post-meta-boxes-area .meta-box-sortables';

/**
 * Scrolls the other meta box areas into view when a meta box drag starts. A drop
 * zone that is scrolled out of view, e.g. at the bottom of the sidebar, can't
 * be reached while dragging.
 *
 * `postboxes` adds the `is-dragging-metaboxes` class, which gives empty areas a
 * height, and refreshes the cached drop zone positions only after this handler
 * runs. The class is added here so that the enlarged drop zones are scrolled to.
 *
 * @param {Event} event The jQuery UI `sortstart` event.
 */
function revealMetaBoxDropZones( event ) {
	document.body.classList.add( 'is-dragging-metaboxes' );
	document.querySelectorAll( META_BOX_SORTABLES ).forEach( ( sortables ) => {
		if ( sortables !== event.currentTarget ) {
			sortables.scrollIntoView( { block: 'nearest' } );
		}
	} );
}

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
					? hasIncompatibleMetaBox(
							select( editPostStore ).getAllMetaBoxes()
						)
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
	] );

	// Adjust the drag and drop that `postboxes` sets up, which assumes the
	// classic editor's single scrolling page. Runs after the effect above, which
	// initializes `postboxes`.
	useEffect( () => {
		const jQuery = window.jQuery;
		if ( ! isEnabledAndEditorReady || ! jQuery?.fn?.sortable ) {
			return;
		}

		// Keep the drag helper out of the meta box scroll containers, so it
		// doesn't stretch or get clipped by them. The wrapper matches the meta
		// box area markup, so that the helper keeps the meta box styles.
		const dragHelperWrapper = document.createElement( 'div' );
		dragHelperWrapper.className =
			'edit-post-meta-boxes-area is-drag-helper';
		const dragHelperContainer = document.createElement( 'div' );
		dragHelperContainer.id = 'poststuff';
		dragHelperWrapper.append( dragHelperContainer );
		document.body.append( dragHelperWrapper );

		// Not limited to `META_BOX_SORTABLES`: an area that isn't rendered yet,
		// e.g. the sidebar one while the sidebar is closed, is outside it.
		jQuery( '.meta-box-sortables' ).sortable(
			'option',
			'appendTo',
			dragHelperContainer
		);

		jQuery( document ).on(
			'sortstart',
			META_BOX_SORTABLES,
			revealMetaBoxDropZones
		);

		return () => {
			jQuery( document ).off(
				'sortstart',
				META_BOX_SORTABLES,
				revealMetaBoxDropZones
			);
			dragHelperWrapper.remove();
		};
	}, [ isEnabledAndEditorReady ] );
};
