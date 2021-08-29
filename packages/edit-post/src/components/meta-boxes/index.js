/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import MetaBoxesArea from './meta-boxes-area';
import MetaBoxVisibility from './meta-box-visibility';
import { store as editPostStore } from '../../store';

export default function MetaBoxes( { location } ) {
	const registry = useRegistry();
	const { isEditorReady, metaBoxes, isVisible, postType } = useSelect(
		( select ) => {
			const { __unstableIsEditorReady, getCurrentPostType } = select(
				editorStore
			);
			const {
				isMetaBoxLocationVisible,
				getMetaBoxesPerLocation,
			} = select( editPostStore );
			return {
				isEditorReady: __unstableIsEditorReady(),
				metaBoxes: getMetaBoxesPerLocation( location ),
				isVisible: isMetaBoxLocationVisible( location ),
				postType: getCurrentPostType(),
			};
		},
		[ location ]
	);
	const { isSavingPost, isAutosavingPost } = useSelect( editorStore );
	const { hasMetaBoxes } = useSelect( editPostStore );
	const initialized = useRef( false );

	// When editor is ready, initialize postboxes (wp core script) and metabox
	// saving.
	useEffect( () => {
		if (
			postType !== undefined &&
			isEditorReady &&
			! initialized.current
		) {
			initialized.current = true;

			if ( window.postboxes.page !== postType ) {
				window.postboxes.add_postbox_toggles( postType );
			}

			let wasSavingPost = isSavingPost();
			let wasAutosavingPost = isAutosavingPost();

			// Save metaboxes when performing a full save on the post.
			registry.subscribe( () => {
				// Save metaboxes on save completion, except for autosaves that are not a post preview.
				//
				// Meta boxes are initialized once at page load. It is not necessary to
				// account for updates on each state change.
				//
				// See: https://github.com/WordPress/WordPress/blob/5.1.1/wp-admin/includes/post.php#L2307-L2309
				const shouldTriggerMetaboxesSave =
					hasMetaBoxes() &&
					wasSavingPost &&
					! isSavingPost() &&
					! wasAutosavingPost;

				// Save current state for next inspection.
				wasSavingPost = isSavingPost();
				wasAutosavingPost = isAutosavingPost();

				if ( shouldTriggerMetaboxesSave ) {
					registry.dispatch( editPostStore ).requestMetaBoxUpdates();
				}
			} );
		}
	}, [ isEditorReady, postType ] );

	if ( ! isEditorReady ) {
		return null;
	}

	return (
		<>
			{ map( metaBoxes, ( { id } ) => (
				<MetaBoxVisibility key={ id } id={ id } />
			) ) }
			{ isVisible && <MetaBoxesArea location={ location } /> }
		</>
	);
}
