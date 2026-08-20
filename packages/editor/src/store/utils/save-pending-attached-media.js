import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '..';
import { unlock } from '../../lock-unlock';
import getMediaIdsInBlocks from '../../utils/media-ids-in-blocks';

/**
 * Attaches the media the user left checked in the pre-publish review.
 *
 * The panel derives what to offer and records the user's answer in the editor
 * store; this reads it back. It cannot happen in the panel, which is unmounted
 * the moment Publish is pressed.
 *
 * Pruned against the blocks as they are *now*, not as they were when the panel
 * rendered — the post can be edited with the panel open, and an image removed
 * in the meantime should not be attached.
 *
 * Runs after the post entity has saved, so publishing and attaching cannot race:
 * an attachment written first would briefly inherit the parent's draft status
 * and be hidden from visitors wherever else it appears.
 *
 * @param {Object} registry A `@wordpress/data` registry.
 * @param {number} postId   ID of the post that was saved.
 */
export default async function savePendingAttachedMedia( registry, postId ) {
	const { getMediaToAttach } = unlock( registry.select( editorStore ) );
	const { getBlocks } = registry.select( blockEditorStore );
	const { saveEntityRecord } = registry.dispatch( coreStore );

	const mediaInPost = getMediaIdsInBlocks( getBlocks() );
	const attachmentIds = getMediaToAttach().filter( ( id ) =>
		mediaInPost.includes( id )
	);

	// `allSettled` so one attachment the user turns out not to be able to edit
	// doesn't strand the rest. Nothing is retried: the review is tied to this
	// publish, and the panel derives afresh next time it opens.
	await Promise.allSettled(
		attachmentIds.map( ( attachmentId ) =>
			saveEntityRecord( 'postType', 'attachment', {
				id: attachmentId,
				post: postId,
			} )
		)
	);
}
