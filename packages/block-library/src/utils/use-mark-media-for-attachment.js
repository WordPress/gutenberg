import { store as coreStore } from '@wordpress/core-data';
import { useRegistry } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Normalizes a value to a positive integer post ID, or `undefined`.
 *
 * @param {*} postId Value to normalize.
 * @return {number|undefined} The post ID, or `undefined` when it isn't one.
 */
function normalizePostId( postId ) {
	const parsedPostId = typeof postId === 'number' ? postId : Number( postId );

	return Number.isInteger( parsedPostId ) && parsedPostId > 0
		? parsedPostId
		: undefined;
}

/**
 * Reads the parent a picker's payload claims for an attachment, when it says.
 *
 * The two payload shapes name it differently, and each has its own "no parent"
 * value: REST records (the DataViews modal, and uploads) expose `post`, `null`
 * when unattached; the classic Backbone modal's `toJSON()` shape exposes
 * `uploadedTo`, `0` when unattached. A *missing* key means the payload never
 * carried the parent - `slimImageObject` strips `uploadedTo` on the classic
 * modal's `onUpdate` path, for one - so it is reported as unknown rather than
 * collapsed into "unattached", and the caller resolves the record instead.
 *
 * This is only a fast path for skipping already-attached media without a
 * request. The resolved record, not this, is the source of truth.
 *
 * @param {Object} mediaItem A media item from a picker's selection payload.
 * @return {number|undefined} The parent post ID (`0` when unattached), or
 *                            `undefined` when the payload doesn't say.
 */
function getClaimedParent( mediaItem ) {
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
 * Returns a callback that marks unattached media as belonging to the post being
 * edited, without writing anything.
 *
 * Selecting media from a picker has never parented it to the post, while
 * uploading always has - so the same image reads as `Unattached` or not
 * depending only on how it reached the block. This closes that gap, but leaves
 * the decision visible and reversible: the callback records a *pending*
 * `editEntityRecord` edit, which the user reviews (and can skip per image)
 * before it is saved.
 *
 * Ownership sits with the block on purpose. A media picker is opened for all
 * sorts of reasons - a featured image, a social sharing image, an avatar, any
 * field a plugin renders - and nothing at the picker layer can tell which. A
 * block whose whole purpose is displaying media the post uses can.
 *
 * @param {Object} blockContext            Block context.
 * @param {number} [blockContext.postId]   ID of the post being edited.
 * @param {string} [blockContext.postType] Post type being edited.
 * @param {number} [blockContext.queryId]  Set when inside a Query Loop.
 * @return {Function} Callback accepting a media item or an array of them.
 */
export default function useMarkMediaForAttachment( {
	postId,
	postType,
	queryId,
} = {} ) {
	const registry = useRegistry();

	return useCallback(
		async ( mediaItems ) => {
			const parentPostId = normalizePostId( postId );

			// Inside a Query Loop `postId` is whichever post the loop is
			// rendering, not the one being edited - so it must never become a
			// parent. Templates and patterns are already excluded by the check
			// above: the editor provides them a `postType` with no `postId`.
			if ( ! parentPostId || Number.isFinite( queryId ) ) {
				return;
			}

			const { getPostType, getEntityRecord, canUser } =
				registry.resolveSelect( coreStore );

			// A post type with no front end is a poor owner for media, the same
			// way a template is.
			const postTypeObject = await getPostType( postType );

			if ( ! postTypeObject?.viewable ) {
				return;
			}

			const { editEntityRecord } = registry.dispatch( coreStore );

			const items = Array.isArray( mediaItems )
				? mediaItems
				: [ mediaItems ];

			const attachmentIds = [
				...new Set(
					items
						// Media the payload already reports as belonging to
						// another post is dropped without a request. Anything
						// else - explicitly unattached, or unknown - is a
						// candidate, and the resolved record decides.
						.filter( ( item ) => ! getClaimedParent( item ) )
						.map( ( item ) => normalizePostId( item?.id ) )
						.filter( Boolean )
				),
			];

			await Promise.all(
				attachmentIds.map( async ( attachmentId ) => {
					try {
						// Resolving the record does three jobs at once, which is
						// why it is worth a request: it establishes the real
						// parent (the payload may not have carried one), it
						// makes the pending edit *visible* - the dirty-record
						// selector skips any record it cannot read, and reads in
						// the default context - and it warms the cache for the
						// thumbnail the review panel shows.
						const record = await getEntityRecord(
							'postType',
							'attachment',
							attachmentId
						);

						// Only ever fill an empty parent. Never steal one.
						if ( normalizePostId( record?.post ) ) {
							return;
						}

						// Attaching writes to the attachment, so a user who
						// cannot edit it is offered nothing rather than a
						// checkbox that fails on save.
						if (
							! ( await canUser( 'update', {
								kind: 'postType',
								name: 'attachment',
								id: attachmentId,
							} ) )
						) {
							return;
						}

						// `undoIgnore` keeps this out of the block editor's undo
						// stack: undoing the insertion should not half-revert an
						// entity edit the user reviews separately.
						editEntityRecord(
							'postType',
							'attachment',
							attachmentId,
							{ post: parentPostId },
							{ undoIgnore: true }
						);
					} catch ( error ) {
						// Marking media is a silent convenience: failing leaves
						// it unattached, which is the state it was already in.
						// Never interpolate the error - a rejected `apiFetch` is
						// not reliably an `Error`.
						window.console.warn(
							'Could not mark media for attachment.',
							error
						);
					}
				} )
			);
		},
		[ registry, postId, postType, queryId ]
	);
}
