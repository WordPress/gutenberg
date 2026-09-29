import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Blocks whose contents belong to something else, so we don't look inside
 * them. The Image block doesn't defer crops inside these either.
 */
const SHARED_CONTENT_BLOCKS = [ 'core/block', 'core/template-part' ];

/**
 * How each block that can hold a pending media edit points itself at the new
 * attachment once the edit is saved.
 *
 * This mirrors `getNewAttachmentImageBlockAttributes` in the Image block,
 * which the editor can't import.
 */
const ATTRIBUTES_FOR_SAVED_MEDIA = {
	'core/image': ( attributes, media ) => {
		const next = { id: media.id, url: media.source_url };
		const { sizeSlug, linkDestination } = attributes;
		const sizes = media.media_details?.sizes;

		if ( sizeSlug && sizeSlug !== 'full' && sizes ) {
			// WordPress doesn't make sub-sizes larger than the file, so the
			// cropped image may not have the size the block had selected.
			if ( sizes[ sizeSlug ]?.source_url ) {
				next.url = sizes[ sizeSlug ].source_url;
			} else {
				next.sizeSlug = 'full';
			}
		}

		if ( linkDestination === 'media' ) {
			next.href = media.source_url;
		} else if ( linkDestination === 'attachment' && media.link ) {
			next.href = media.link;
		}

		return next;
	},
};

/**
 * Whether a block holds a pending edit to the image it currently shows. One
 * made on an image the block no longer shows is stale.
 *
 * @param {Object} block A block.
 * @return {boolean} Whether the edit should be committed.
 */
function hasCurrentPendingEdit( block ) {
	const { pendingMediaEdit, id } = block.attributes;
	return (
		!! pendingMediaEdit &&
		pendingMediaEdit.sourceId === id &&
		!! ATTRIBUTES_FOR_SAVED_MEDIA[ block.name ]
	);
}

/**
 * Identifies an edit, so blocks holding the same edit to the same image (a
 * duplicated block, say) share one new attachment.
 *
 * @param {Object} pendingMediaEdit The edit.
 * @return {string} The key.
 */
function getEditKey( pendingMediaEdit ) {
	return `${ pendingMediaEdit.sourceId }:${ JSON.stringify(
		pendingMediaEdit.modifiers
	) }`;
}

/**
 * Collects the pending edits in a block tree, keyed by `getEditKey`.
 *
 * @param {Object[]} blocks Blocks to search.
 * @param {Map}      edits  Map to add to.
 * @return {Map} The edits.
 */
function collectPendingEdits( blocks, edits = new Map() ) {
	for ( const block of blocks ) {
		if ( hasCurrentPendingEdit( block ) ) {
			const edit = block.attributes.pendingMediaEdit;
			edits.set( getEditKey( edit ), edit );
		}
		if ( ! SHARED_CONTENT_BLOCKS.includes( block.name ) ) {
			collectPendingEdits( block.innerBlocks, edits );
		}
	}
	return edits;
}

/**
 * Whether any of a post's blocks hold a media edit waiting to be saved.
 *
 * @param {Object[]} blocks The post's blocks.
 * @return {boolean} Whether there's anything to commit.
 */
export function hasPendingMediaEdits( blocks ) {
	return collectPendingEdits( blocks ).size > 0;
}

/**
 * Points every block whose edit was saved at the new attachment, and drops
 * stale edits. Only the blocks that change are copied, so an untouched tree
 * comes back as the same array.
 *
 * @param {Object[]} blocks Blocks to update.
 * @param {Map}      saved  New attachments, keyed by `getEditKey`.
 * @return {Object[]} The updated blocks.
 */
function applySavedEdits( blocks, saved ) {
	let hasChanged = false;
	const nextBlocks = blocks.map( ( block ) => {
		let nextBlock = block;
		const { pendingMediaEdit } = block.attributes;

		if ( pendingMediaEdit ) {
			if ( ! hasCurrentPendingEdit( block ) ) {
				nextBlock = {
					...block,
					attributes: {
						...block.attributes,
						pendingMediaEdit: undefined,
					},
				};
			} else {
				const media = saved.get( getEditKey( pendingMediaEdit ) );
				if ( media ) {
					nextBlock = {
						...block,
						attributes: {
							...block.attributes,
							...ATTRIBUTES_FOR_SAVED_MEDIA[ block.name ](
								block.attributes,
								media
							),
							pendingMediaEdit: undefined,
						},
					};
				}
			}
		}

		if ( ! SHARED_CONTENT_BLOCKS.includes( block.name ) ) {
			const innerBlocks = applySavedEdits( block.innerBlocks, saved );
			if ( innerBlocks !== block.innerBlocks ) {
				nextBlock = { ...nextBlock, innerBlocks };
			}
		}

		if ( nextBlock !== block ) {
			hasChanged = true;
		}
		return nextBlock;
	} );
	return hasChanged ? nextBlocks : blocks;
}

/**
 * Saves one pending edit as a new attachment, the way the media editor would
 * have when the crop was made.
 *
 * @param {Object} registry         A `@wordpress/data` registry.
 * @param {Object} pendingMediaEdit The edit.
 * @return {Promise<Object>} The new attachment.
 */
async function saveEdit( registry, pendingMediaEdit ) {
	const { sourceId, sourceUrl, modifiers } = pendingMediaEdit;
	const source = await registry
		.resolveSelect( coreStore )
		.getEntityRecord( 'postType', 'attachment', sourceId );

	const media = await apiFetch( {
		path: `/wp/v2/media/${ sourceId }/edit`,
		method: 'POST',
		data: {
			src: sourceUrl ?? source?.source_url,
			modifiers,
			// `/edit` doesn't carry the parent post across to the new
			// attachment, so pass it on.
			...( source?.post !== undefined && { post: source.post } ),
		},
	} );

	registry
		.dispatch( coreStore )
		.receiveEntityRecords(
			'postType',
			'attachment',
			media,
			undefined,
			true
		);

	return media;
}

/**
 * Saves the media edits held on a post's blocks, such as crops made in the
 * media editor, and points the blocks at the new attachments.
 *
 * Each distinct edit is saved once, however many blocks hold it. Edits that
 * were saved are applied even when others fail, so trying again only repeats
 * the failures.
 *
 * The blocks are updated by `applyTo` rather than returned, so the caller can
 * apply the result to the blocks as they are once the requests finish.
 *
 * @param {Object}   registry A `@wordpress/data` registry.
 * @param {Object[]} blocks   The post's blocks.
 * @return {Promise<{applyTo: (blocks: Object[]) => Object[], error?: Object}>} `applyTo( blocks )`
 * returns the blocks pointed at the new attachments — the same array when
 * nothing changes — and `error` is the first failure, if any.
 */
export default async function commitPendingMediaEdits( registry, blocks ) {
	const edits = collectPendingEdits( blocks );
	const saved = new Map();
	let error;

	const results = await Promise.allSettled(
		[ ...edits ].map( async ( [ key, edit ] ) => {
			saved.set( key, await saveEdit( registry, edit ) );
		} )
	);

	for ( const result of results ) {
		if ( result.status === 'rejected' ) {
			error = result.reason;
			break;
		}
	}

	return {
		applyTo: ( currentBlocks ) => applySavedEdits( currentBlocks, saved ),
		error,
	};
}
