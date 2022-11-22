/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

export function getBlockFromMedia( media, mediaType ) {
	// Add the common attributes between the different media types.
	const attributes = {
		id: media.id,
	};
	// Some props are named differently between the Media REST API and Media Library API.
	// For example `source_url` is used in the former and `url` is used in the latter..
	const caption = media.caption?.rendered || media.caption;
	if ( caption && typeof caption === 'string' ) {
		attributes.caption = caption;
	}
	if ( mediaType === 'image' ) {
		attributes.url = media.source_url || media.url;
		attributes.alt = media.alt_text || media.alt || undefined;
	} else if ( [ 'video', 'audio' ].includes( mediaType ) ) {
		attributes.src = media.source_url || media.url;
	}
	return createBlock( `core/${ mediaType }`, attributes );
}
