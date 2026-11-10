import { Button, Spinner as WCSpinner } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { copy, download, file } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { Card, EmptyState, Icon, Stack, Text } from '@wordpress/ui';
import { useMediaEditorContext } from '../media-editor-provider';
import type { Media } from '../media-editor-provider';
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
	fileName?: string;
	fileDetails?: string;
	onLoad: () => void;
	onError: () => void;
	loadingState: 'loading' | 'loaded' | 'error';
}

/**
 * Returns the value of one of the attachment fields for the media, or an
 * empty string if the field isn't available.
 *
 * @param fields  The attachment fields.
 * @param fieldId The id of the field to read.
 * @param media   The media record.
 */
function getFieldValue(
	fields: Array< {
		id: string;
		getValue?: ( args: { item: Media } ) => unknown;
	} >,
	fieldId: string,
	media: Media
): string {
	const field = fields.find( ( { id } ) => id === fieldId );
	const value = field?.getValue?.( { item: media } );
	return typeof value === 'string' ? value : '';
}

function MediaPreviewFileActions( { mediaUrl }: { mediaUrl: string } ) {
	const { createSuccessNotice } = useDispatch( noticesStore );
	const copyRef = useCopyToClipboard( mediaUrl, () => {
		createSuccessNotice( __( 'Copied URL to clipboard.' ), {
			type: 'snackbar',
		} );
	} );

	return (
		<>
			{ /*
			 * Browsers ignore `download` for cross-origin URLs, e.g. media
			 * offloaded to a CDN, and open the file instead.
			 */ }
			<Button
				__next40pxDefaultSize
				variant="primary"
				href={ mediaUrl }
				download
				icon={ download }
			>
				{ __( 'Download' ) }
			</Button>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				ref={ copyRef }
				icon={ copy }
			>
				{ __( 'Copy URL' ) }
			</Button>
		</>
	);
}

interface MediaPreviewFileCardProps {
	mediaUrl: string;
	fileName?: string;
	fileDetails?: string;
}

function MediaPreviewFileCard( {
	mediaUrl,
	fileName,
	fileDetails,
}: MediaPreviewFileCardProps ) {
	return (
		<Card.Root className="media-editor-preview__file-card">
			<Card.Content>
				<Stack direction="column" align="center" gap="md">
					<Icon
						className="media-editor-preview__file-icon"
						icon={ file }
					/>
					<Stack direction="column" align="center" gap="xs">
						{ !! fileName && (
							<Text
								variant="heading-sm"
								className="media-editor-preview__file-name"
							>
								{ fileName }
							</Text>
						) }
						{ !! fileDetails && (
							<Text
								variant="body-sm"
								className="media-editor-preview__file-details"
							>
								{ fileDetails }
							</Text>
						) }
					</Stack>
					<Stack justify="center" gap="sm" wrap="wrap">
						<MediaPreviewFileActions mediaUrl={ mediaUrl } />
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

function MediaPreviewContent( {
	previewType,
	mediaUrl,
	altText,
	displayTitle,
	fileName,
	fileDetails,
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
					<MediaPreviewFileCard
						mediaUrl={ mediaUrl }
						fileName={ fileName }
						fileDetails={ fileDetails }
					/>
				</object>
			);
		default:
			return (
				<MediaPreviewFileCard
					mediaUrl={ mediaUrl }
					fileName={ fileName }
					fileDetails={ fileDetails }
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
	const { media, fields } = useMediaEditorContext();

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
				<EmptyState.Root>
					<EmptyState.Icon icon={ file } />
					<EmptyState.Title>
						{ __( 'No media file available.' ) }
					</EmptyState.Title>
				</EmptyState.Root>
			</div>
		);
	}

	const displayTitle =
		typeof title === 'string' ? title : title?.rendered || title?.raw;

	// Read through the attachment fields, so the values match the Details
	// panel. Without a filename field, fall back to the title.
	const fileName =
		( media && getFieldValue( fields, 'filename', media ) ) || displayTitle;
	const fileSize = media ? getFieldValue( fields, 'filesize', media ) : '';
	const fileDetails =
		mimeType && fileSize
			? sprintf(
					/* translators: 1: File type, e.g. "application/zip". 2: File size, e.g. "2.4 MB". */
					_x( '%1$s · %2$s', 'file type and size' ),
					mimeType,
					fileSize
				)
			: mimeType || fileSize;

	if ( loadingState === 'error' ) {
		return (
			<div className="media-editor-preview media-editor-preview--error">
				<EmptyState.Root>
					<EmptyState.Icon icon={ file } />
					<EmptyState.Title>
						{ __( 'Failed to load media file.' ) }
					</EmptyState.Title>
					{ !! fileName && (
						<EmptyState.Description className="media-editor-preview__file-name">
							{ fileName }
						</EmptyState.Description>
					) }
					<EmptyState.Actions className="media-editor-preview__error-actions">
						<MediaPreviewFileActions mediaUrl={ mediaUrl } />
					</EmptyState.Actions>
				</EmptyState.Root>
			</div>
		);
	}

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
				fileName={ fileName }
				fileDetails={ fileDetails }
				onLoad={ () => setLoadingState( 'loaded' ) }
				onError={ () => setLoadingState( 'error' ) }
				loadingState={ loadingState }
			/>
		</div>
	);
}
