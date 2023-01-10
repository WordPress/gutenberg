/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const mediaTypeTag = { image: 'img', video: 'video', audio: 'audio' };

export function getBlockAndPreviewFromMedia( media, mediaType ) {
	// Add the common attributes between the different media types.
	const attributes = {
		id: media.id,
	};
	// Some props are named differently between the Media REST API and Media Library API.
	// For example `source_url` is used in the former and `url` is used in the latter.
	const mediaSrc = media.source_url || media.url;
	const alt = media.alt_text || media.alt || undefined;
	const caption = media.caption?.raw || media.caption;
	if ( caption && typeof caption === 'string' ) {
		attributes.caption = caption;
	}
	if ( mediaType === 'image' ) {
		attributes.url = mediaSrc;
		attributes.alt = alt;
	} else if ( [ 'video', 'audio' ].includes( mediaType ) ) {
		attributes.src = mediaSrc;
	}
	const PreviewTag = mediaTypeTag[ mediaType ];
	const preview = (
		<PreviewTag
			src={ mediaSrc }
			alt={ alt }
			controls={ mediaType === 'audio' ? true : undefined }
			inert="true"
		/>
	);
	return [ createBlock( `core/${ mediaType }`, attributes ), preview ];
}
