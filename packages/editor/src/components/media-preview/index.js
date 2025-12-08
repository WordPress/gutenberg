/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Determines the media type from a MIME type string.
 *
 * @param {string} mimeType - The MIME type to check.
 * @return {Object} Object with type property ('image', 'video', 'audio', or 'application').
 */
function getMediaTypeFromMimeType( mimeType ) {
	if ( ! mimeType ) {
		return { type: 'application' };
	}

	if ( mimeType.startsWith( 'image/' ) ) {
		return { type: 'image' };
	}
	if ( mimeType.startsWith( 'video/' ) ) {
		return { type: 'video' };
	}
	if ( mimeType.startsWith( 'audio/' ) ) {
		return { type: 'audio' };
	}
	return { type: 'application' };
}

/**
 * MediaPreview component displays the media file in the editor canvas.
 * Supports images, videos, audio files, and generic file displays.
 *
 * @return {Element} The MediaPreview component.
 */
export default function MediaPreview() {
	const [ hasError, setHasError ] = useState( false );

	const { mediaUrl, mimeType, altText, title, isLoading } = useSelect(
		( select ) => {
			const currentPost = select( editorStore ).getCurrentPost();
			return {
				mediaUrl: currentPost?.source_url,
				mimeType: currentPost?.mime_type,
				altText: currentPost?.alt_text,
				title: currentPost?.title?.rendered || currentPost?.title,
				isLoading: ! currentPost,
			};
		},
		[]
	);

	if ( isLoading ) {
		return (
			<div className="editor-media-preview editor-media-preview--loading">
				<Spinner />
			</div>
		);
	}

	if ( ! mediaUrl ) {
		return (
			<div className="editor-media-preview editor-media-preview--empty">
				<p>No media file available.</p>
			</div>
		);
	}

	if ( hasError ) {
		return (
			<div className="editor-media-preview editor-media-preview--error">
				<p>Failed to load media file.</p>
				<p className="editor-media-preview__url">{ mediaUrl }</p>
			</div>
		);
	}

	const mediaType = getMediaTypeFromMimeType( mimeType );

	// Render based on media type
	switch ( mediaType.type ) {
		case 'image':
			return (
				<div className="editor-media-preview editor-media-preview--image">
					<img
						src={ mediaUrl }
						alt={ altText || '' }
						onError={ () => setHasError( true ) }
					/>
				</div>
			);
		case 'video':
			return (
				<div className="editor-media-preview editor-media-preview--video">
					<video
						src={ mediaUrl }
						controls
						onError={ () => setHasError( true ) }
					>
						{ title }
					</video>
				</div>
			);
		case 'audio':
			return (
				<div className="editor-media-preview editor-media-preview--audio">
					<audio
						src={ mediaUrl }
						controls
						onError={ () => setHasError( true ) }
					>
						{ title }
					</audio>
				</div>
			);
		default:
			return (
				<div className="editor-media-preview editor-media-preview--file">
					<div className="editor-media-preview__file-info">
						<p className="editor-media-preview__file-name">
							{ title }
						</p>
						<p className="editor-media-preview__mime-type">
							{ mimeType }
						</p>
						<a
							href={ mediaUrl }
							target="_blank"
							rel="noopener noreferrer"
							className="editor-media-preview__download-link"
						>
							View file
						</a>
					</div>
				</div>
			);
	}
}
