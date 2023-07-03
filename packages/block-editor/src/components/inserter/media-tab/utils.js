/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const mediaTypeTag = { image: 'img', video: 'video', audio: 'audio' };

/** @typedef {import('./hooks').InserterMediaItem} InserterMediaItem */

/**
 * Creates a block and a preview element from a media object.
 *
 * @param {InserterMediaItem}         media     The media object to create the block from.
 * @param {('image'|'audio'|'video')} mediaType The media type to create the block for.
 * @return {[WPBlock, JSX.Element]} An array containing the block and the preview element.
 */
export function getBlockAndPreviewFromMedia( media, mediaType ) {
	// Add the common attributes between the different media types.
	const attributes = {
		id: media.id || undefined,
		caption: media.caption || undefined,
	};
	const mediaSrc = media.url;
	const alt = media.alt || undefined;
	if ( mediaType === 'image' ) {
		attributes.url = mediaSrc;
		attributes.alt = alt;
	} else if ( [ 'video', 'audio' ].includes( mediaType ) ) {
		attributes.src = mediaSrc;
	}
	const PreviewTag = mediaTypeTag[ mediaType ];
	const preview = (
		<PreviewTag
			src={ media.previewUrl || mediaSrc }
			alt={ alt }
			controls={ mediaType === 'audio' ? true : undefined }
			inert="true"
			onError={ ( { currentTarget } ) => {
				// Fall back to the media source if the preview cannot be loaded.
				if ( currentTarget.src === media.previewUrl ) {
					currentTarget.src = mediaSrc;
				}
			} }
		/>
	);
	return [ createBlock( `core/${ mediaType }`, attributes ), preview ];
}
