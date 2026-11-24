import { createBlock } from '@wordpress/blocks';
import { escapeEditableHTML } from '@wordpress/escape-html';
import { _x } from '@wordpress/i18n';
import { inertValue } from '@wordpress/react-inert-value';
import { getFilename } from '@wordpress/url';
import type { Block } from '@wordpress/blocks';
import type { ReactElement, SyntheticEvent } from 'react';
import FilePreview from './file-preview';
import type { MediaItem, MediaType } from './types';

const mediaTypeTag: Partial< Record< MediaType, 'img' | 'video' > > = {
	image: 'img',
	video: 'video',
};

/**
 * Creates a File block for media that has no block of its own, such as a PDF.
 * Mirrors what the File block sets when a file is chosen from its placeholder.
 *
 * @param media The media object to create the block from.
 * @return The File block.
 */
function createFileBlock( media: MediaItem ): Block {
	// `fileName` is rich text, so a plain-text name is escaped to keep it as
	// text, as the block's transforms do. `title.rendered` is already HTML.
	const { title } = media;
	const plainTitle = typeof title === 'string' ? title : title?.raw;
	const renderedTitle =
		typeof title === 'string' ? undefined : title?.rendered;
	const fileName = plainTitle
		? escapeEditableHTML( plainTitle )
		: renderedTitle || escapeEditableHTML( getFilename( media.url ) ?? '' );
	const isPdf =
		( media.mime || media.mime_type ) === 'application/pdf' ||
		getFilename( media.url )?.toLowerCase().endsWith( '.pdf' );
	const block = createBlock( 'core/file', {
		id: media.id || undefined,
		href: media.url,
		fileName,
		textLinkHref: media.url,
		// `createBlock` bypasses the default variation, which is where the
		// translated button text is set, so set it here as the transforms do.
		downloadButtonText: _x( 'Download', 'button label' ),
		displayPreview: isPdf || undefined,
	} );
	// Links the download button to the file name through `aria-describedby`.
	// It is built from the block's `clientId`, which only exists once the
	// block is created.
	block.attributes.fileId = `wp-block-file--media-${ block.clientId }`;
	return block;
}

/**
 * A media item's id, used for item identity in the grid.
 *
 * Library items carry a numeric `id` and external ones (e.g. Openverse) carry
 * a `sourceId`, but both are optional in `InserterMediaItem`, so a category
 * registered through the public API may supply neither. `url` is required, so
 * it serves as the fallback rather than stringifying `undefined` and giving
 * every such item the same id.
 *
 * @param media The media object.
 * @return The id, as a string.
 */
export function getItemId( media: MediaItem ): string {
	return String( media.id ?? media.sourceId ?? media.url );
}

/**
 * Creates a block and a preview element from a media object.
 *
 * @param media     The media object to create the block from.
 * @param mediaType The media type to create the block for.
 * @return An array containing the block and the preview element.
 */
export function getBlockAndPreviewFromMedia(
	media: MediaItem,
	mediaType: MediaType
): [ Block, ReactElement ] {
	const mediaSrc = media.url;
	// Shown for media with no visual preview of its own: files and audio.
	const filePreview = (
		<FilePreview url={ mediaSrc } mediaType={ mediaType } />
	);
	if ( mediaType === 'file' ) {
		return [ createFileBlock( media ), filePreview ];
	}
	// Add the common attributes between the different media types.
	const attributes: Record< string, unknown > = {
		id: media.id || undefined,
		caption: media.caption || undefined,
	};
	const alt = media.alt || undefined;
	if ( mediaType === 'image' ) {
		attributes.url = mediaSrc;
		attributes.alt = alt;
	} else if ( [ 'video', 'audio' ].includes( mediaType ) ) {
		attributes.src = mediaSrc;
	}
	const PreviewTag = mediaTypeTag[ mediaType ];
	const preview = PreviewTag ? (
		<PreviewTag
			src={ media.previewUrl || mediaSrc }
			alt={ alt }
			inert={ inertValue( true ) }
			onError={ ( {
				currentTarget,
			}: SyntheticEvent< HTMLImageElement | HTMLVideoElement > ) => {
				// Fall back to the media source if the preview cannot be loaded.
				if ( currentTarget.src === media.previewUrl ) {
					currentTarget.src = mediaSrc;
				}
			} }
		/>
	) : (
		filePreview
	);
	return [ createBlock( `core/${ mediaType }`, attributes ), preview ];
}
