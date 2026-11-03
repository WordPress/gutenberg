import { Spinner as WCSpinner } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
	previewType: string;
	mediaUrl: string;
	altText?: string;
	displayTitle?: string;
	mimeType?: string;
	onLoad: () => void;
	onError: () => void;
	loadingState: 'loading' | 'loaded' | 'error';
}

interface MediaPreviewFileInfoProps {
	mediaUrl: string;
	displayTitle?: string;
	mimeType?: string;
}

function MediaPreviewFileInfo( {
	mediaUrl,
	displayTitle,
	mimeType,
}: MediaPreviewFileInfoProps ) {
	return (
		<div className="media-editor-preview__file-info">
			<p className="media-editor-preview__file-name">{ displayTitle }</p>
			<p className="media-editor-preview__mime-type">{ mimeType }</p>
			{ /* eslint-disable-next-line react/jsx-no-target-blank */ }
			<a
				href={ mediaUrl }
				target="_blank"
				rel="noopener"
				className="media-editor-preview__download-link"
			>
				{ __( 'View file' ) }
			</a>
		</div>
	);
}

function MediaPreviewContent( {
	previewType,
	mediaUrl,
	altText,
	displayTitle,
	mimeType,
	onLoad,
	onError,
	loadingState,
}: MediaPreviewContentProps ) {
	switch ( previewType ) {
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
		case 'pdf':
			// The browser renders the children instead of the PDF when it
			// can't display it, e.g. when the request fails.
			return (
				<object
					className="media-editor-preview__pdf"
					// Ask the viewer to fit the whole page rather than the
					// width. Chrome reads `view`, Firefox reads `zoom`, and
					// Safari ignores both.
					data={ `${ mediaUrl }#view=Fit&zoom=page-fit` }
					type="application/pdf"
					aria-label={ __( 'Embed of the selected PDF file.' ) }
				>
					<MediaPreviewFileInfo
						mediaUrl={ mediaUrl }
						displayTitle={ displayTitle }
						mimeType={ mimeType }
					/>
				</object>
			);
		default:
			return (
				<MediaPreviewFileInfo
					mediaUrl={ mediaUrl }
					displayTitle={ displayTitle }
					mimeType={ mimeType }
				/>
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

	// Without a built-in PDF viewer (e.g. on most mobile browsers), show
	// the file info instead of an embed that can't render.
	const previewType =
		mimeType === 'application/pdf' && window.navigator.pdfViewerEnabled
			? 'pdf'
			: mediaType.type;

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
			className={ `media-editor-preview media-editor-preview--${ previewType }` }
		>
			{ previewType === 'image' && loadingState === 'loading' && (
				<div className="media-editor-preview__spinner">
					<WCSpinner />
				</div>
			) }
			<MediaPreviewContent
				previewType={ previewType }
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
