/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

export function getBlocksFromMedia( media, mediaType ) {
	let attributes;
	// TODO: check all the needed attributes(alt, caption, poster, etc..)
	if ( mediaType === 'image' ) {
		attributes = {
			id: media.id,
			// TODO: check this better(difference between media REST API and `media` object from Media Library).
			url: media.source_url || media.url,
			caption: media.caption?.rendered || undefined,
			alt: media.alt_text,
		};
	} else if ( mediaType === 'video' || mediaType === 'audio' ) {
		attributes = {
			id: media.id,
			src: media.source_url || media.url,
		};
	}
	return createBlock( `core/${ mediaType }`, attributes );
}
