import type { DataRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { invalidateAttachmentResolutions } from './invalidate-attachment-resolutions';

/**
 * The shape a media item can arrive in. The classic Backbone modal hands over
 * `toJSON()` output, the DataViews modal hands over transformed REST records,
 * and both are looser than the `Attachment` type.
 */
type MediaItem = Record< string, unknown > | null | undefined;

/**
 * Normalizes a value to a positive integer post ID, or `undefined`.
 *
 * @param postId Value to normalize.
 */
function normalizePostId( postId: unknown ): number | undefined {
	const parsedPostId = typeof postId === 'number' ? postId : Number( postId );

	return Number.isInteger( parsedPostId ) && parsedPostId > 0
		? parsedPostId
		: undefined;
}

/**
 * Returns the post currently being edited, if media can be attached to it.
 *
 * `wp_enqueue_media()` is what populates this: `edit-form-blocks.php` calls it
 * as `wp_enqueue_media( array( 'post' => $post->ID ) )`, which is also where the
 * classic modal's uploader reads the post to attach uploads to
 * (`uploader.params.post_id`). Everywhere else — the site editor included — it
 * is left at its `0` default, so this returns `undefined` and attaching is
 * skipped.
 *
 * That makes this narrower than the editor's upload path, which resolves the
 * post itself (`mediaUpload` in `@wordpress/editor` reads `getCurrentPost()` and
 * falls back to a template's `wp_id`), and so parents uploads to templates too.
 * Selecting existing media deliberately stops at the post editor: reparenting an
 * attachment that already exists is a heavier, more surprising change than
 * parenting a file the user just uploaded, and a template is a poor owner for
 * media that may be shown across the whole site.
 */
function getCurrentPostId(): number | undefined {
	const { wp } = window as Window &
		typeof globalThis & {
			wp?: {
				media?: { view?: { settings?: { post?: { id?: unknown } } } };
			};
		};

	return normalizePostId( wp?.media?.view?.settings?.post?.id );
}

/**
 * Resolves the post an attachment is currently attached to, reading only what
 * the picker already handed us.
 *
 * The two payload shapes name the parent differently, and each has its own "no
 * parent" value:
 *
 * - REST records (the DataViews modal) expose `post`, which is `null` — not
 *   `0` — when the attachment is unattached.
 * - The classic Backbone modal's `toJSON()` shape exposes `uploadedTo`, which
 *   is `0` when unattached.
 *
 * A *missing* key is not the same as an unattached item: it means the payload
 * never carried the parent, so we cannot tell. That distinction is what keeps
 * this from stealing attachments, so it is preserved rather than collapsed.
 *
 * There is deliberately no core-data fallback here. `getEntityRecord()` triggers
 * the resolver rather than passively reading cache, so it would issue one REST
 * request per selected item. Pickers that drop the parent are fixed at the
 * source instead (see `slimImageObject` in the classic `MediaUpload`).
 *
 * @param mediaItem A media item from a picker's selection payload.
 *
 * @return The parent post ID (`0` when unattached), or `undefined` when the
 *         payload doesn't say.
 */
function getAttachmentParent( mediaItem: MediaItem ): number | undefined {
	if ( ! mediaItem || typeof mediaItem !== 'object' ) {
		return undefined;
	}

	if ( Object.hasOwn( mediaItem, 'post' ) ) {
		return normalizePostId( mediaItem.post ) ?? 0;
	}

	if ( Object.hasOwn( mediaItem, 'uploadedTo' ) ) {
		return normalizePostId( mediaItem.uploadedTo ) ?? 0;
	}

	return undefined;
}

/**
 * Attaches any unattached media in a picker selection to the post being edited,
 * mirroring what uploading into that post has always done.
 *
 * Fire-and-forget by contract: callers must not await this, so a slow or failed
 * write can never block the selection from landing in the editor. Items already
 * attached to another post are skipped, as are items whose parent the payload
 * didn't report — an attachment owned by another post must never be silently
 * reparented.
 *
 * @param mediaItems The picker's selection payload.
 * @param registry   A `@wordpress/data` registry (`useRegistry()`), or the
 *                   default-registry `{ select, dispatch }` exports.
 */
export function attachMediaToCurrentPost(
	mediaItems: MediaItem | MediaItem[],
	registry: Pick< DataRegistry, 'select' | 'dispatch' >
) {
	const postId = getCurrentPostId();
	if ( ! postId ) {
		return;
	}

	const items = Array.isArray( mediaItems ) ? mediaItems : [ mediaItems ];

	// Only ever fill an empty parent. Never steal one, and never guess.
	const attachmentIds = [
		...new Set(
			items
				.filter( ( item ) => getAttachmentParent( item ) === 0 )
				.map( ( item ) => normalizePostId( item?.id ) )
				.filter( Boolean )
		),
	] as number[];

	if ( ! attachmentIds.length ) {
		return;
	}

	const { saveEntityRecord, __experimentalBatch } =
		registry.dispatch( coreStore );

	const write =
		attachmentIds.length === 1
			? // A single write skips the OPTIONS preflight the batch endpoint
			  // needs, which is the common case by a wide margin.
			  saveEntityRecord(
					'postType',
					'attachment',
					{ id: attachmentIds[ 0 ], post: postId },
					{ throwOnError: true }
			  )
			: __experimentalBatch(
					attachmentIds.map(
						( attachmentId ) =>
							( {
								saveEntityRecord: save,
							}: {
								saveEntityRecord: typeof saveEntityRecord;
							} ) =>
								save( 'postType', 'attachment', {
									id: attachmentId,
									post: postId,
								} )
					)
			  );

	Promise.resolve( write )
		.then( () => {
			// Both modals invalidate the attachment cache when they close, but
			// this write is deliberately not awaited, so it can land after that
			// invalidation. Invalidate again so surfaces listing media by parent
			// — the Gallery block's dynamic mode, the "Attached images" inserter
			// tab — pick the new parent up.
			invalidateAttachmentResolutions( registry );
		} )
		.catch( ( error ) => {
			// Attaching is a silent convenience: a failure leaves the media
			// unattached, which is exactly the state it was already in. Never
			// interpolate the error — a rejected `apiFetch` is not reliably an
			// `Error`, so `${ error }` can yield "[object Object]".
			window.console.warn( 'Could not attach media to the post.', error );
		} );
}
