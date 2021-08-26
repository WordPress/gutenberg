/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, select, subscribe, dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import MetaBoxesArea from './meta-boxes-area';
import MetaBoxVisibility from './meta-box-visibility';
import { store as editPostStore } from '../../store';

export default function MetaBoxes( { location } ) {
	const { isReady, metaBoxes, isVisible, postType } = useSelect(
		( _select ) => {
			const { __unstableIsEditorReady, getCurrentPostType } = _select(
				editorStore
			);
			const {
				isMetaBoxLocationVisible,
				getMetaBoxesPerLocation,
			} = _select( editPostStore );
			return {
				isReady: __unstableIsEditorReady(),
				metaBoxes: getMetaBoxesPerLocation( location ),
				isVisible: isMetaBoxLocationVisible( location ),
				postType: getCurrentPostType(),
			};
		}
	);
	const [ initialized, setInitialized ] = useState( false );

	// When editor is ready, initialize postboxes (wp core script) and metabox
	// saving.
	useEffect( () => {
		let saveMetaboxUnsubscribe;

		if ( postType !== undefined && isReady && ! initialized ) {
			setInitialized( true );

			if ( window.postboxes.page !== postType ) {
				window.postboxes.add_postbox_toggles( postType );
			}

			let wasSavingPost = select( editorStore ).isSavingPost();
			let wasAutosavingPost = select( editorStore ).isAutosavingPost();
			const hasActiveMetaBoxes = select( editPostStore ).hasMetaBoxes();

			// Save metaboxes when performing a full save on the post.
			saveMetaboxUnsubscribe = subscribe( () => {
				const isSavingPost = select( editorStore ).isSavingPost();
				const isAutosavingPost = select(
					editorStore
				).isAutosavingPost();

				// Save metaboxes on save completion, except for autosaves that are not a post preview.
				//
				// Meta boxes are initialized once at page load. It is not necessary to
				// account for updates on each state change.
				//
				// See: https://github.com/WordPress/WordPress/blob/5.1.1/wp-admin/includes/post.php#L2307-L2309
				const shouldTriggerMetaboxesSave =
					hasActiveMetaBoxes &&
					wasSavingPost &&
					! isSavingPost &&
					! wasAutosavingPost;

				// Save current state for next inspection.
				wasSavingPost = isSavingPost;
				wasAutosavingPost = isAutosavingPost;

				if ( shouldTriggerMetaboxesSave ) {
					dispatch( editPostStore ).requestMetaBoxUpdates();
				}
			} );
		}

		return () => saveMetaboxUnsubscribe && saveMetaboxUnsubscribe();
	}, [ isReady, postType, initialized ] );

	if ( ! isReady ) {
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
