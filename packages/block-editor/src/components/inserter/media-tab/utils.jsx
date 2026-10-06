import { createBlock } from '@wordpress/blocks';
import { inertValue } from '@wordpress/react-inert-value';

const mediaTypeTag = { image: 'img', video: 'video', audio: 'audio' };

/** @typedef {import('./hooks').InserterMediaItem} InserterMediaItem */

/**
 * A media item minus `title`, which the interface types as a required
 * string while core sources spread in the REST record's `{ raw, rendered }`
 * object and others may omit it. Neither helper here reads it.
 *
 * @typedef {Omit<InserterMediaItem, 'title'>} MediaItemFields
 */

/**
 * A media item's id, used for item identity in the grid.
 *
 * Library items carry a numeric `id` and external ones (e.g. Openverse) carry
 * a `sourceId`, but both are optional in `InserterMediaItem`, so a category
 * registered through the public API may supply neither. `url` is required, so
 * it serves as the fallback rather than stringifying `undefined` and giving
 * every such item the same id.
 *
 * @param {MediaItemFields} media The media object.
 * @return {string} The id, as a string.
 */
export function getItemId( media ) {
	return String( media.id ?? media.sourceId ?? media.url );
}

/**
 * Creates a block and a preview element from a media object.
 *
 * @param {MediaItemFields}           media     The media object to create the block from.
 * @param {('image'|'audio'|'video')} mediaType The media type to create the block for.
 * @return {[WPBlock, React.JSX.Element]} An array containing the block and the preview element.
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
			inert={ inertValue( true ) }
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
