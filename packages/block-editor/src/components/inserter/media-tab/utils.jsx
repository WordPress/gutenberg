import { createBlock } from '@wordpress/blocks';
import { inertValue } from '@wordpress/react-inert-value';
import { __ } from '@wordpress/i18n';
import { getFilename } from '@wordpress/url';

const mediaTypeTag = { image: 'img', video: 'video', audio: 'audio' };

/** @typedef {import('./hooks').InserterMediaItem} InserterMediaItem */

/**
 * Reads a media item's title. Each source exposes it differently: core-data
 * attachment records carry the `{ raw, rendered }` shape, while external
 * sources (e.g. Openverse) and the classic media modal pass a plain string.
 *
 * @param {InserterMediaItem} media The media object.
 * @return {string|undefined} The title, or `undefined` when the item has none.
 */
export function getMediaTitle( media ) {
	if ( typeof media.title === 'string' ) {
		return media.title || undefined;
	}
	return media.title?.raw || media.title?.rendered || undefined;
}

/**
 * Creates a block and a preview element from a media object.
 *
 * Media types that a browser can render inline (`image`, `video`, `audio`) map
 * to their matching core block and preview tag. Everything else — PDFs,
 * documents, archives — becomes a File block, previewed as a labelled
 * placeholder since there is no element that can display it.
 *
 * @param {InserterMediaItem} media     The media object to create the block from.
 * @param {string}            mediaType The media type to create the block for, as a coarse
 *                                      MIME type (e.g. `image`, `audio`, `video`, `application`).
 * @return {[WPBlock, React.JSX.Element]} An array containing the block and the preview element.
 */
export function getBlockAndPreviewFromMedia( media, mediaType ) {
	const mediaSrc = media.url;
	const PreviewTag = mediaTypeTag[ mediaType ];

	// There is no element that can render a file, so build a File block with a
	// placeholder naming it instead. Anything that isn't playable or viewable
	// inline lands here, which also covers a media type the tab doesn't offer
	// its own category for (e.g. `text`) but the Media Library still allows.
	if ( ! PreviewTag ) {
		const fileName =
			getMediaTitle( media ) || getFilename( mediaSrc ) || __( 'File' );
		return [
			createBlock( 'core/file', {
				id: media.id || undefined,
				href: mediaSrc,
				fileName,
				textLinkHref: mediaSrc,
			} ),
			<div
				key="preview"
				className="block-editor-inserter__media-list__item-preview-placeholder"
			>
				<span>{ fileName }</span>
			</div>,
		];
	}

	// Add the common attributes between the different media types.
	const attributes = {
		id: media.id || undefined,
		caption: media.caption || undefined,
	};
	const alt = media.alt || undefined;
	if ( mediaType === 'image' ) {
		attributes.url = mediaSrc;
		attributes.alt = alt;
	} else {
		attributes.src = mediaSrc;
	}
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
