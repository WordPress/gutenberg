/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useMediaEditorContext } from '../media-editor-provider';
import { getMediaTypeFromMimeType } from '../../utils';

/**
 * Props for MediaPreview component.
 */
export interface MediaPreviewProps {
	[ key: string ]: any; // TODO: Define specific props as needed, this will likely be for click handlers, accessibility attributes, etc.
}

/**
 * MediaPreview component displays the media file in the editor canvas.
 * Supports images, videos, audio files, and generic file displays.
 *
 * @param props - Component props including click handlers and accessibility attributes.
 * @return The MediaPreview component.
 */
export default function MediaPreview( props: MediaPreviewProps ) {
	const [ loadingState, setLoadingState ] = useState<
		'loading' | 'loaded' | 'error'
	>( 'loading' );
	const { media } = useMediaEditorContext();

	const {
		source_url: mediaUrl,
		mime_type: mimeType,
		alt_text: altText,
		title,
	} = media || {};

	const mediaType = getMediaTypeFromMimeType( mimeType );

	if ( ! mediaUrl ) {
		return (
			<div className="media-editor-preview media-editor-preview--empty">
				<p>No media file available.</p>
			</div>
		);
	}

	if ( mediaType.type === 'image' && loadingState === 'loading' ) {
		return (
			<div className="media-editor-preview media-editor-preview--loading">
				<Spinner />
			</div>
		);
	}

	if ( loadingState === 'error' ) {
		return (
			<div className="media-editor-preview media-editor-preview--error">
				<p>Failed to load media file.</p>
				<p className="media-editor-preview__url">{ mediaUrl }</p>
			</div>
		);
	}

	const displayTitle =
		typeof title === 'string' ? title : title?.rendered || title?.raw;

	// Render based on media type
	switch ( mediaType.type ) {
		case 'image':
			return (
				<div
					{ ...props }
					className="media-editor-preview media-editor-preview--image"
				>
					<img
						src={ mediaUrl }
						alt={ altText || '' }
						onLoad={ () => setLoadingState( 'loaded' ) }
						onError={ () => setLoadingState( 'error' ) }
					/>
				</div>
			);
		case 'video':
			return (
				<div
					{ ...props }
					className="media-editor-preview media-editor-preview--video"
				>
					<video
						src={ mediaUrl }
						controls
						onError={ () => setLoadingState( 'error' ) }
					>
						{ displayTitle }
					</video>
				</div>
			);
		case 'audio':
			return (
				<div
					{ ...props }
					className="media-editor-preview media-editor-preview--audio"
				>
					<audio
						src={ mediaUrl }
						controls
						onError={ () => setLoadingState( 'error' ) }
					>
						{ displayTitle }
					</audio>
				</div>
			);
		default:
			return (
				<div
					{ ...props }
					className="media-editor-preview media-editor-preview--file"
				>
					<div className="media-editor-preview__file-info">
						<p className="media-editor-preview__file-name">
							{ displayTitle }
						</p>
						<p className="media-editor-preview__mime-type">
							{ mimeType }
						</p>
						<a
							href={ mediaUrl }
							target="_blank"
							rel="noopener noreferrer"
							className="media-editor-preview__download-link"
						>
							View file
						</a>
					</div>
				</div>
			);
	}
}
