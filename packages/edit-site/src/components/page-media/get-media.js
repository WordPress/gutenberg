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
				height={ 100 }
				width={ 100 }
				style={ { borderRadius: '8px', flexShrink: 0 } }
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
				height={ 100 }
				width={ 100 }
				style={ { borderRadius: '8px', flexShrink: 0 } }
				src={ attachment.media_details.sizes.thumbnail.source_url }
				alt={ attachment.alt_text }
			/>
		) : (
			<img
				src={ attachment.media_details.sizes.large.source_url }
				alt={ attachment.alt_text }
			/>
		);
	}

	if ( 'audio' === mediaType ) {
		return <Icon icon={ audio } size={ 128 } />;
	}

	if ( 'video' === mediaType ) {
		return <Icon icon={ video } size={ 128 } />;
	}

	// Everything else is a file.
	return <Icon icon={ page } size={ 128 } />;
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
