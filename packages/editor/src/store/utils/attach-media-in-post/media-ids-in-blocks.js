/**
 * Which attribute each block keeps its image ID in. Adding Cover, Media & Text,
 * Video, Audio or File is a one-line change.
 *
 * A list rather than "any attribute called `id`", because `core/block`,
 * `core/navigation-link` and `core/query` all have numeric IDs that aren't
 * images. Galleries need no entry of their own: they hold `core/image` blocks
 * inside them, and the old format that kept its own list of IDs is converted to
 * those blocks when the post is parsed.
 */
const MEDIA_ID_ATTRIBUTES = {
	'core/image': 'id',
};

/**
 * Blocks whose contents belong to something else, so we don't look inside them.
 * A synced pattern can be used on twenty posts, and whichever one saved first
 * would claim its images — for good, since we only ever fill in a blank parent.
 */
const SHARED_CONTENT_BLOCKS = [ 'core/block', 'core/template-part' ];

/**
 * Flattens a block tree into a list, skipping shared content.
 *
 * @param {Object[]} blocks Blocks to flatten.
 * @return {Object[]} Every block that belongs to this post.
 */
function flattenBlocks( blocks ) {
	const result = [];

	blocks.forEach( ( block ) => {
		result.push( block );

		if ( ! SHARED_CONTENT_BLOCKS.includes( block.name ) ) {
			result.push( ...flattenBlocks( block.innerBlocks ) );
		}
	} );

	return result;
}

/**
 * Collects the image IDs a post's blocks show.
 *
 * Sorted because these IDs become a `getEntityRecords` query, and its cache is
 * keyed on the list exactly as given — so reordering two images would otherwise
 * fetch a set we already have.
 *
 * @param {Object[]} blocks The post's blocks.
 * @return {number[]} Image IDs, lowest first, with duplicates removed.
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
