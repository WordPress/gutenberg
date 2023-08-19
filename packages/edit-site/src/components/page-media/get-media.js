/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { video, audio, page } from '@wordpress/icons';
import { isBlobURL } from '@wordpress/blob';

// Getting headings, etc. based on `mediaType` query type.
export function getMediaItem( attachment, size = 'thumb' ) {
	if ( isBlobURL( attachment.url ) ) {
		return size === 'thumb' ? (
			<img
				className="edit-site-media-item__thumbnail"
				src={ attachment.url }
				alt=""
			/>
		) : (
			<img src={ attachment.url } alt="" />
		);
	}

	const mediaType = getMediaTypeFromMimeType( attachment.mime_type );

	if ( 'image' === mediaType ) {
		return size === 'thumb' ? (
			<img
				className="edit-site-media-item__thumbnail"
				src={ attachment.media_details.sizes.thumbnail.source_url }
				alt={ attachment.alt_text }
			/>
		) : (
			<img
				className="edit-site-media-item__thumbnail"
				src={
					attachment.media_details.sizes.large?.source_url ??
					attachment.media_details.sizes.full.source_url
				}
				alt={ attachment.alt_text }
			/>
		);
	}

	if ( 'audio' === mediaType ) {
		return (
			<div className="edit-site-media-item__icon">
				<Icon icon={ audio } />
			</div>
		);
	}

	if ( 'video' === mediaType ) {
		return (
			<div className="edit-site-media-item__icon">
				<Icon icon={ video } />
			</div>
		);
	}

	// Everything else is a file.
	return (
		<div className="edit-site-media-item__icon">
			<Icon icon={ page } />
		</div>
	);
}

export function getMediaTypeFromMimeType( mimeType ) {
	// @todo this needs to be abstracted and the
	//  media types formalized somewhere.
	if ( mimeType.startsWith( 'image/' ) ) {
		return 'image';
	}

	if ( mimeType.startsWith( 'video/' ) ) {
		return 'video';
	}

	if ( mimeType.startsWith( 'audio/' ) ) {
		return 'audio';
	}

	return 'application';
}
