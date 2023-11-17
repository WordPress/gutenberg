/**
 * Returns a suggested post format for the given blocks, inferred only if there
 * is a single block within the post and it is of a type known to match a
 * default post format. Returns null if the format cannot be determined.
 *
 * @param {Array} blocks The blocks to check.
 *
 * @return {?string} Suggested post format.
 */
export function getSuggestedPostFormat( blocks ) {
	if ( blocks.length > 2 ) return null;

	let name;
	// If there is only one block in the content of the post grab its name
	// so we can derive a suitable post format from it.
	if ( blocks.length === 1 ) {
		name = blocks[ 0 ].name;
		// Check for core/embed `video` and `audio` eligible suggestions.
		if ( name === 'core/embed' ) {
			const provider = blocks[ 0 ].attributes?.providerNameSlug;
			if ( [ 'youtube', 'vimeo' ].includes( provider ) ) {
				name = 'core/video';
			} else if ( [ 'spotify', 'soundcloud' ].includes( provider ) ) {
				name = 'core/audio';
			}
		}
	}

	// If there are two blocks in the content and the last one is a text blocks
	// grab the name of the first one to also suggest a post format from it.
	if ( blocks.length === 2 && blocks[ 1 ].name === 'core/paragraph' ) {
		name = blocks[ 0 ].name;
	}

	// We only convert to default post formats in core.
	switch ( name ) {
		case 'core/image':
			return 'image';
		case 'core/quote':
		case 'core/pullquote':
			return 'quote';
		case 'core/gallery':
			return 'gallery';
		case 'core/video':
			return 'video';
		case 'core/audio':
			return 'audio';
		default:
			return null;
	}
}
