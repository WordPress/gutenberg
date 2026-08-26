/**
 * The attribute each block stores its attachment ID in.
 *
 * An explicit map rather than "any numeric attribute called `id`": `core/block`,
 * `core/navigation-link` and `core/query` all carry numeric IDs that are not
 * attachments, and attaching one of those would be worse than missing an image.
 *
 * Galleries need no entry of their own. A modern gallery holds inner
 * `core/image` blocks, which the walk below reaches, and the legacy format that
 * stored its own array of IDs is migrated to those inner blocks when the post is
 * parsed — see `runV2Migration` in the Gallery block's `deprecated.js` — so a
 * gallery carrying `ids` never reaches the editor's block tree.
 *
 * Widening this to Cover, Media & Text, Video, Audio and File is a one-line
 * change — the post's blocks are read on save rather than each block reporting
 * what it holds, so a block needs no involvement to be covered.
 */
const MEDIA_ID_ATTRIBUTES = {
	'core/image': 'id',
};

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

/**
 * Flattens a block tree into a single list, stopping at entity boundaries.
 *
 * @param {Object[]} blocks Blocks to flatten.
 * @return {Object[]} Every block in the tree that belongs to this post.
 */
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
 * Sorted rather than left in block order. The result is a *set* — which media
 * the post displays — and the only thing consuming it is a `getEntityRecords`
 * query, whose cache key includes `include` as given. `get-query-parts.js`
 * normalizes that list but does not sort it, so `[ 12, 13 ]` and `[ 13, 12 ]`
 * are separate cache entries: without this, reordering two images would refetch
 * a set already in the cache on the next save.
 *
 * @param {Object[]} blocks The post's blocks, unflattened.
 * @return {number[]} Attachment IDs, ascending, deduplicated.
 */
export default function getMediaIdsInBlocks( blocks ) {
	const mediaIds = new Set();

	flattenBlocks( blocks ).forEach( ( block ) => {
		const attribute = MEDIA_ID_ATTRIBUTES[ block.name ];

		if ( ! attribute ) {
			return;
		}

		const id = block.attributes?.[ attribute ];

		if ( Number.isInteger( id ) && id > 0 ) {
			mediaIds.add( id );
		}
	} );

	return [ ...mediaIds ].sort( ( a, b ) => a - b );
}
