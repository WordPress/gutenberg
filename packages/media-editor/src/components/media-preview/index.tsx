import clsx from 'clsx';
import { speak } from '@wordpress/a11y';
import { Button, Spinner as WCSpinner } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import {
	check,
	copy,
	download,
	error as errorIcon,
	folder,
} from '@wordpress/icons';
import { EmptyState } from '@wordpress/ui';
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

const COPY_FEEDBACK_TIMEOUT = 2000;

type CopyResult = 'idle' | 'copied' | 'error';

const COPY_RESULT_ICONS = {
	idle: copy,
	copied: check,
	error: errorIcon,
};

/**
 * Copies the text and shows the result on the copy button, following the
 * Copy to Clipboard design system pattern.
 *
 * @param text The text to copy.
 */
function useCopyWithFeedback( text: string ) {
	// Bump the id on every result, so a repeat of the same result restarts
	// the time the icon stays visible.
	const [ feedback, setFeedback ] = useState< {
		result: CopyResult;
		id: number;
	} >( { result: 'idle', id: 0 } );

	useEffect( () => {
		if ( feedback.result === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setFeedback( { result: 'idle', id: 0 } ),
			COPY_FEEDBACK_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ feedback ] );

	function report( result: Exclude< CopyResult, 'idle' >, message: string ) {
		setFeedback( ( current ) => ( { result, id: current.id + 1 } ) );
		speak( message );
	}

	const ref = useCopyToClipboard(
		text,
		() => report( 'copied', __( 'Copied URL to clipboard.' ) ),
		() => report( 'error', __( "Couldn't copy URL to clipboard." ) )
	);

	return { result: feedback.result, ref };
}

function MediaPreviewFileActions( { mediaUrl }: { mediaUrl: string } ) {
	const { result, ref } = useCopyWithFeedback( mediaUrl );

	return (
		<>
			{ /*
			 * Browsers ignore `download` for cross-origin URLs, e.g. media
			 * offloaded to a CDN, and show the file instead. Open it in a new
			 * tab so it doesn't replace the editor.
			 */ }
			<Button
				__next40pxDefaultSize
				variant="primary"
				href={ mediaUrl }
				target="_blank"
				download
				icon={ download }
			>
				{ __( 'Download' ) }
			</Button>
			{ /* The label stays the same, and the icon shows the result. */ }
			<Button
				__next40pxDefaultSize
				variant="secondary"
				ref={ ref }
				icon={ COPY_RESULT_ICONS[ result ] }
			>
				{ __( 'Copy URL' ) }
			</Button>
		</>
	);
}

interface MediaPreviewFileInfoProps {
	mediaUrl: string;
	fileName?: string;
	fileDetails?: string;
}

function MediaPreviewFileInfo( {
	mediaUrl,
	fileName,
	fileDetails,
}: MediaPreviewFileInfoProps ) {
	return (
		<EmptyState.Root>
			<EmptyState.Icon icon={ folder } />
			{ !! fileName && (
				<EmptyState.Title className="media-editor-preview__file-name">
					{ fileName }
				</EmptyState.Title>
			) }
			{ !! fileDetails && (
				<EmptyState.Description>{ fileDetails }</EmptyState.Description>
			) }
			<EmptyState.Actions className="media-editor-preview__actions">
				<MediaPreviewFileActions mediaUrl={ mediaUrl } />
			</EmptyState.Actions>
		</EmptyState.Root>
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
					<MediaPreviewFileInfo
						mediaUrl={ mediaUrl }
						fileName={ fileName }
						fileDetails={ fileDetails }
					/>
				</object>
			);
		default:
			return (
				<MediaPreviewFileInfo
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
			<div className="media-editor-preview media-editor-preview--empty is-placeholder">
				<EmptyState.Root>
					<EmptyState.Icon icon={ folder } />
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
			<div className="media-editor-preview media-editor-preview--error is-placeholder">
				<EmptyState.Root>
					<EmptyState.Icon icon={ folder } />
					<EmptyState.Title>
						{ __( 'Failed to load media file.' ) }
					</EmptyState.Title>
					{ !! fileName && (
						<EmptyState.Description className="media-editor-preview__file-name">
							{ fileName }
						</EmptyState.Description>
					) }
					<EmptyState.Actions className="media-editor-preview__actions">
						<MediaPreviewFileActions mediaUrl={ mediaUrl } />
					</EmptyState.Actions>
				</EmptyState.Root>
			</div>
		);
	}

	return (
		<div
			{ ...props }
			className={ clsx(
				'media-editor-preview',
				`media-editor-preview--${ previewType }`,
				{
					// Media with no preview of its own shows the file info.
					'is-placeholder': previewType === 'application',
				}
			) }
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
