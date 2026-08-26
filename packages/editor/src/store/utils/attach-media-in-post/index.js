import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { privateApis as mediaUtilsPrivateApis } from '@wordpress/media-utils';
import { unlock } from '../../../lock-unlock';
import getMediaIdsInBlocks from './media-ids-in-blocks';

const { invalidateAttachmentResolutions } = unlock( mediaUtilsPrivateApis );

/**
 * Attaches the media a post displays to that post, if it belongs to no post yet.
 *
 * Uploading a file into a post has always parented that attachment to the post;
 * selecting an existing file from the Media Library never has. So the same image
 * reads as `Unattached` or not depending only on how it reached the block, and
 * media that is genuinely in use looks safe to delete.
 *
 * Runs on save and reads the post's blocks, which is what keeps the scope
 * honest in both directions. Only media an Image or Gallery block displays is
 * considered — a featured image, a site icon, or a picker an SEO plugin renders
 * is not this post's to claim. And media added and then removed before saving is
 * simply not in the tree, so it is never attached.
 *
 * Silent by design, the way the Classic Editor was: attachment is a detail of
 * how WordPress records media, not a decision worth interrupting someone for.
 * The affordance for undoing it already exists and is better than a prompt — the
 * inserter's attached-media tab has a persistent per-item "Detach from post".
 *
 * @param {Object} registry A `@wordpress/data` registry.
 * @param {number} postId   ID of the post that was saved.
 * @param {string} postType Type of the post that was saved.
 */
export default async function attachMediaInPost( registry, postId, postType ) {
	const mediaIds = getMediaIdsInBlocks(
		registry.select( blockEditorStore ).getBlocks()
	);

	if ( ! mediaIds.length ) {
		return;
	}

	// A post type with no front end of its own is a poor owner for media. A
	// template is the clearest case: it has no URL, and the same template backs
	// many posts, so "uploaded to" pointing at it says nothing useful. `savePost`
	// handles templates as well as posts, so this has to be checked rather than
	// assumed. Ordered after the cheap block scan so a post with no media at all
	// still costs nothing.
	const postTypeObject = await registry
		.resolveSelect( coreStore )
		.getPostType( postType );

	if ( ! postTypeObject?.viewable ) {
		return;
	}

	// `resolveSelect`, not `select`: a plain select here would kick off the
	// resolver and hand back `undefined` in the same breath. One request covers
	// the post — `fetch-all-middleware` rewrites `per_page: -1` to 100.
	const media = await registry
		.resolveSelect( coreStore )
		.getEntityRecords( 'postType', 'attachment', {
			include: mediaIds,
			per_page: -1,
		} );

	// Only ever fill an empty parent. An attachment that already belongs to
	// another post is left alone: `post_parent` holds one post, so claiming it
	// here would silently take the file away from wherever it came from.
	// WordPress reports "belongs to nothing" as `null`, never `0`.
	const unattached = ( media ?? [] ).filter( ( item ) => ! item.post );

	if ( ! unattached.length ) {
		return;
	}

	const { saveEntityRecord } = registry.dispatch( coreStore );

	// `allSettled` so one file the user turns out not to be able to edit doesn't
	// strand the rest. Failures stay quiet: nothing was promised, and a file that
	// fails to attach is left exactly as it already was.
	const results = await Promise.allSettled(
		unattached.map( ( item ) =>
			saveEntityRecord( 'postType', 'attachment', {
				id: item.id,
				post: postId,
			} )
		)
	);

	if ( ! results.some( ( { status } ) => status === 'fulfilled' ) ) {
		return;
	}

	// Saving a record updates that record, but not the cached queries listing
	// media by parent. Without this the Gallery block's dynamic mode and the
	// inserter's attached-media tab keep showing the pre-save answer until the
	// page is reloaded.
	invalidateAttachmentResolutions( registry );
}
