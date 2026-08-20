import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Block attributes holding the ID of an attachment the block displays.
 *
 * Mirrors the map the pre-publish review panel prunes with, so the list the user
 * approved and the list that gets written cannot drift.
 */
const MEDIA_ID_ATTRIBUTES = {
	'core/image': [ 'id' ],
	'core/gallery': [ 'ids' ],
};

function flattenBlocks( blocks ) {
	const result = [];

	blocks.forEach( ( block ) => {
		result.push( block );
		result.push( ...flattenBlocks( block.innerBlocks ) );
	} );

	return result;
}

/**
 * Writes the attachments the user left checked in the pre-publish review.
 *
 * The Image and Gallery blocks record a pending `post` edit when unattached
 * media is selected into them, and the review panel discards the edit outright
 * for anything the user unchecks — so what is still pending here is exactly what
 * was approved. There is no separate exclusion list to consult.
 *
 * Pruning happens against the blocks as they are *now*, not as they were when
 * the panel rendered: an image inserted and then deleted must not be attached,
 * and the panel can be open while the post is edited behind it.
 *
 * Runs after the post entity has saved, so publishing and attaching cannot race:
 * an attachment written first would briefly inherit the parent's draft status.
 *
 * @param {Object} registry A `@wordpress/data` registry.
 * @param {number} postId   ID of the post that was saved.
 */
export default async function savePendingAttachedMedia( registry, postId ) {
	const { getBlocks } = registry.select( blockEditorStore );
	const { getEntityRecordEdits } = registry.select( coreStore );
	const { saveEditedEntityRecord } = registry.dispatch( coreStore );

	const mediaInPost = new Set();

	flattenBlocks( getBlocks() ).forEach( ( block ) => {
		MEDIA_ID_ATTRIBUTES[ block.name ]?.forEach( ( attribute ) => {
			const value = block.attributes?.[ attribute ];

			( Array.isArray( value ) ? value : [ value ] ).forEach( ( id ) => {
				if ( Number.isInteger( id ) && id > 0 ) {
					mediaInPost.add( id );
				}
			} );
		} );
	} );

	const attachmentIds = [ ...mediaInPost ].filter(
		( attachmentId ) =>
			getEntityRecordEdits( 'postType', 'attachment', attachmentId )
				?.post === postId
	);

	// `allSettled` so one attachment the user turns out not to be able to edit
	// doesn't strand the rest. A rejection leaves that edit pending, so the next
	// save retries it.
	await Promise.allSettled(
		attachmentIds.map( ( attachmentId ) =>
			saveEditedEntityRecord( 'postType', 'attachment', attachmentId )
		)
	);
}
