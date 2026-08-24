/**
 * Block attributes holding the ID of an attachment the block displays.
 *
 * An explicit map rather than "any numeric attribute called `id`": `core/block`,
 * `core/navigation-link` and `core/query` all carry numeric IDs that are not
 * attachments, and proposing to attach one of those would be worse than missing
 * an image.
 *
 * Galleries need no entry beyond the legacy one: modern galleries hold inner
 * `core/image` blocks, and only the pre-v7 format stored its own array of IDs.
 *
 * Widening this to Cover, Media & Text, Video, Audio and File is a one-line
 * change — the post's blocks are read on save rather than each block reporting
 * what it holds, so a block needs no involvement to be covered.
 */
const MEDIA_ID_ATTRIBUTES = {
	'core/image': [ 'id' ],
	'core/gallery': [ 'ids' ],
};

/**
 * Flattens a block tree into a single list.
 *
 * @param {Object[]} blocks Blocks to flatten.
 * @return {Object[]} Every block in the tree.
 */
/**
 * Blocks whose inner blocks are another entity's content.
 *
 * A synced pattern's blocks are *controlled* inner blocks: `core/block` passes
 * the pattern's own content into `useInnerBlocksProps`, which syncs it into this
 * editor's store under the pattern block's client ID. So they are in this post's
 * block tree without being this post's content, and walking into them would let
 * a post claim media it does not own.
 *
 * That matters more here than a missed image would. A pattern may be used on
 * twenty posts, so whichever one saved first would take the file permanently -
 * arbitrary, invisible, and not undone by saving any of the others.
 */
const ENTITY_BOUNDARY_BLOCKS = [ 'core/block', 'core/template-part' ];

function flattenBlocks( blocks ) {
	const result = [];

	blocks.forEach( ( block ) => {
		result.push( block );

		if ( ! ENTITY_BOUNDARY_BLOCKS.includes( block.name ) ) {
			result.push( ...flattenBlocks( block.innerBlocks ) );
		}
	} );

	return result;
}

/**
 * Collects the attachment IDs a post's blocks display.
 *
 * Shared so the list a user is shown before publishing and the list that is
 * written on publish are derived the same way and cannot drift apart.
 *
 * @param {Object[]} blocks The post's blocks, unflattened.
 * @return {number[]} Attachment IDs, in block order, deduplicated.
 */
export default function getMediaIdsInBlocks( blocks ) {
	const mediaIds = new Set();

	flattenBlocks( blocks ).forEach( ( block ) => {
		MEDIA_ID_ATTRIBUTES[ block.name ]?.forEach( ( attribute ) => {
			const value = block.attributes?.[ attribute ];

			( Array.isArray( value ) ? value : [ value ] ).forEach( ( id ) => {
				if ( Number.isInteger( id ) && id > 0 ) {
					mediaIds.add( id );
				}
			} );
		} );
	} );

	return [ ...mediaIds ];
}
