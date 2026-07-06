/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

// The featured image record is resolved with `context: 'view'` (see
// `post-featured-image/index.js`); the resolution cache is keyed on these exact
// args, so invalidations/lookups here must match them.
const FEATURED_MEDIA_QUERY = { context: 'view' };

/**
 * Reconciles the post's featured image when its attachment is deleted from the
 * media library. `wp_delete_attachment()` clears `_thumbnail_id` server-side,
 * but nothing tells the editor client, so `featured_media` keeps pointing at the
 * deleted id and the Featured Image panel keeps showing it until a reload
 * (https://github.com/WordPress/gutenberg/issues/79820).
 *
 * The deletion can originate from either media modal, and they behave
 * oppositely, so this centralizes the *decision* to clear `featured_media` in one
 * place (`isFeaturedImageDeleted` below) and feeds it from two triggers:
 *
 * 1. **core-data (any core-data delete + load time).** The new DataViews modal
 *    deletes via `deleteEntityRecord` (`REMOVE_ITEMS`), which drops the record
 *    from the cache; and a post can load with `featured_media` already pointing
 *    at a since-deleted attachment (a 404). Both are observable in the
 *    resolution state, so the effect below reacts with no extra plumbing.
 *
 * 2. **the legacy `wp.media` modal.** It deletes via Backbone/AJAX and leaves the
 *    core-data record cached, so trigger 1 never sees it go missing. It also can
 *    be opened from anywhere (inserter, image block, the panel), so we listen to
 *    the global `wp.media` attachments collection. A `remove` on that collection
 *    is itself a reliable deletion signal (Gutenberg's own cache-clearing fires a
 *    fake `destroy` but leaves the item in the collection, so it never triggers
 *    `remove`), so we reconcile directly. We can't round-trip through an
 *    invalidate + re-fetch instead: nothing is guaranteed to re-request the
 *    record — this component's own `useSelect` guards the read behind
 *    `hasFinishedResolution`, and the panel may be unmounted — so the 404 that
 *    trigger 1 needs may never materialize.
 *
 * Mounted for the whole editing session by the editor provider (not the sidebar
 * panel, which may be unmounted). Rendered as a null component.
 */
export default function PostFeaturedImageDeletionListener() {
	const { receiveEntityRecords } = useDispatch( coreStore );

	const { postId, postType, featuredImageId, isFeaturedImageDeleted } =
		useSelect( ( select ) => {
			const {
				getCurrentPostId,
				getCurrentPostType,
				getEditedPostAttribute,
			} = select( editorStore );
			const base = {
				postId: getCurrentPostId(),
				postType: getCurrentPostType(),
			};

			const id = getEditedPostAttribute( 'featured_media' );
			if ( ! id ) {
				return {
					...base,
					featuredImageId: 0,
					isFeaturedImageDeleted: false,
				};
			}

			const {
				getEntityRecord,
				hasFinishedResolution,
				getResolutionError,
			} = select( coreStore );
			const args = [ 'postType', 'attachment', id, FEATURED_MEDIA_QUERY ];

			// Only trust a settled resolution; mid-flight it isn't "deleted".
			if ( ! hasFinishedResolution( 'getEntityRecord', args ) ) {
				return {
					...base,
					featuredImageId: id,
					isFeaturedImageDeleted: false,
				};
			}

			const record = getEntityRecord( ...args );
			const error = getResolutionError( 'getEntityRecord', args );

			// Deleted if the server 404s (a failed re-fetch leaves the stale record
			// in place, so the record alone isn't enough) OR the record was dropped
			// with no error (a core-data `REMOVE_ITEMS`, e.g. the DataViews modal). A
			// non-404 error is a transient failure — leave the post untouched.
			//
			// The `REMOVE_ITEMS` branch assumes a core-data delete: it only fires if
			// the deletion goes through `deleteEntityRecord`. A future modal that
			// deletes via a raw `apiFetch` DELETE wouldn't drop the record from the
			// cache, so it wouldn't be caught here (nor by the `wp.media` listener,
			// which that modal doesn't populate) — it should use `deleteEntityRecord`.
			const deleted =
				error?.data?.status === 404 || ( ! record && ! error );

			return {
				...base,
				featuredImageId: id,
				isFeaturedImageDeleted: deleted,
			};
		}, [] );

	// The single place that reconciles the post with a confirmed deletion.
	const clearFeaturedImage = useCallback( () => {
		// Sync the cached *saved* record rather than editing the post. WordPress'
		// `wp_delete_attachment()` deletes `_thumbnail_id` for every post that
		// referenced the attachment, so the saved state is already
		// `featured_media: 0`. A plain `editPost()` would instead layer an edit
		// on top and mark the post dirty for a change the server has already
		// persisted; syncing the saved baseline clears the panel while matching a
		// reload exactly (value 0, post not dirty).
		receiveEntityRecords( 'postType', postType, {
			id: postId,
			featured_media: 0,
		} );
	}, [ receiveEntityRecords, postType, postId ] );

	// Trigger 1 — core-data: the featured attachment is confirmed gone.
	useEffect( () => {
		if ( isFeaturedImageDeleted ) {
			clearFeaturedImage();
		}
	}, [ isFeaturedImageDeleted, clearFeaturedImage ] );

	// Trigger 2 — legacy `wp.media` modal. Keep the current id and reconcile
	// routine in refs so the once-bound Backbone listener reads the latest values
	// without re-subscribing.
	const featuredImageIdRef = useRef( featuredImageId );
	useEffect( () => {
		featuredImageIdRef.current = featuredImageId;
	}, [ featuredImageId ] );

	const clearFeaturedImageRef = useRef( clearFeaturedImage );
	useEffect( () => {
		clearFeaturedImageRef.current = clearFeaturedImage;
	}, [ clearFeaturedImage ] );

	useEffect( () => {
		// `wp.media` is a WordPress core global, enqueued separately; it may not
		// be present in every editor context.
		const attachments = window.wp?.media?.model?.Attachments?.all;
		if ( ! attachments ) {
			return undefined;
		}

		function onRemove( model ) {
			const removedId = model?.id;
			if ( ! removedId || removedId !== featuredImageIdRef.current ) {
				return;
			}

			clearFeaturedImageRef.current();
		}

		attachments.on( 'remove', onRemove );
		return () => attachments.off( 'remove', onRemove );
	}, [] );

	return null;
}
