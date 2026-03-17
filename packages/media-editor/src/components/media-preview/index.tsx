/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
 * Props for MediaPreviewContent component.
 */
interface MediaPreviewContentProps {
	mediaType: { type: string };
	mediaUrl: string;
	altText?: string;
	displayTitle?: string;
	mimeType?: string;
	onLoad: () => void;
	onError: () => void;
	loadingState: 'loading' | 'loaded' | 'error';
}

function MediaPreviewContent( {
	mediaType,
	mediaUrl,
	altText,
	displayTitle,
	mimeType,
	onLoad,
	onError,
	loadingState,
}: MediaPreviewContentProps ) {
	switch ( mediaType.type ) {
		case 'image':
			return (
				<img
					className={ loadingState === 'loaded' ? 'loaded' : '' }
					src={ mediaUrl }
					alt={ altText || '' }
					onLoad={ onLoad }
					onError={ onError }
				/>
			);
		case 'video':
			return (
				<video src={ mediaUrl } controls onError={ onError }>
					{ displayTitle }
				</video>
			);
		case 'audio':
			return (
				<audio src={ mediaUrl } controls onError={ onError }>
					{ displayTitle }
				</audio>
			);
		default:
			return (
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
						{ __( 'View file' ) }
					</a>
				</div>
			);
	}
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
				<p>{ __( 'No media file available.' ) }</p>
			</div>
		);
	}

	if ( loadingState === 'error' ) {
		return (
			<div className="media-editor-preview media-editor-preview--error">
				<p>{ __( 'Failed to load media file.' ) }</p>
				<p className="media-editor-preview__url">{ mediaUrl }</p>
			</div>
		);
	}

	const displayTitle =
		typeof title === 'string' ? title : title?.rendered || title?.raw;

	return (
		<div
			{ ...props }
			className={ `media-editor-preview media-editor-preview--${ mediaType.type }` }
		>
			{ mediaType.type === 'image' && loadingState === 'loading' && (
				<div className="media-editor-preview__spinner">
					<Spinner />
				</div>
			) }
			<MediaPreviewContent
				mediaType={ mediaType }
				mediaUrl={ mediaUrl }
				altText={ altText }
				displayTitle={ displayTitle }
				mimeType={ mimeType }
				onLoad={ () => setLoadingState( 'loaded' ) }
				onError={ () => setLoadingState( 'error' ) }
				loadingState={ loadingState }
			/>
		</div>
	);
}
