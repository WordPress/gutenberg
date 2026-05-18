/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Component responsible for managing the document title based on the current post.
 */
function DocumentTitle() {
	// Store the original document title so we can restore it when unmounting.
	const originalDocumentTitle = useRef( document.title );

	const { postTitle, postType, siteTitle, isCleanNewPost } = useSelect(
		( select ) => {
			const {
				getEditedPostAttribute,
				isCleanNewPost: selectIsCleanNewPost,
			} = select( editorStore );
			const { getEntityRecord } = select( coreStore );

			return {
				postTitle: getEditedPostAttribute( 'title' ),
				postType: getEditedPostAttribute( 'type' ),
				siteTitle: getEntityRecord( 'root', 'site' )?.title,
				isCleanNewPost: selectIsCleanNewPost(),
			};
		},
		[]
	);

	// Update document title when relevant data changes.
	useEffect( () => {
		if ( ! siteTitle ) {
			return;
		}

		// Determine the action label based on post type and status.
		const getActionLabel = () => {
			if ( isCleanNewPost || ! postTitle?.trim() ) {
				if ( postType === 'post' ) {
					return __( 'Add Post' );
				}
				if ( postType === 'page' ) {
					return __( 'Add Page' );
				}
				return __( 'Add New' );
			}

			if ( postType === 'post' ) {
				return __( 'Edit Post' );
			}
			if ( postType === 'page' ) {
				return __( 'Edit Page' );
			}
			return __( 'Edit' );
		};

		const actionLabel = getActionLabel();

		// Format the document title.
		let documentTitle;
		if ( postTitle && postTitle.trim() && ! isCleanNewPost ) {
			// Post has a title: "Edit Post "Hello world!" ‹ Site Name — WordPress"
			documentTitle = sprintf(
				/* translators: 1: Action (Edit Post, Add Post, etc.), 2: Post title, 3: Site name. */
				__( '%1$s "%2$s" ‹ %3$s — WordPress' ),
				actionLabel,
				decodeEntities( postTitle.trim() ),
				decodeEntities( siteTitle )
			);
		} else {
			// No title: "Add Post ‹ Site Name — WordPress" or "Edit Post ‹ Site Name — WordPress"
			documentTitle = sprintf(
				/* translators: 1: Action (Edit Post, Add Post, etc.), 2: Site name. */
				__( '%1$s ‹ %2$s — WordPress' ),
				actionLabel,
				decodeEntities( siteTitle )
			);
		}

		// Update the document title.
		document.title = documentTitle;
	}, [ postTitle, postType, siteTitle, isCleanNewPost ] );

	// Restore original title on unmount.
	useEffect( () => {
		const originalTitle = originalDocumentTitle.current;
		return () => {
			if ( originalTitle ) {
				document.title = originalTitle;
			}
		};
	}, [] );

	// This component doesn't render any visible content.
	return null;
}

export default DocumentTitle;
