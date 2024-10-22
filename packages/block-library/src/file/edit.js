/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import {
	__unstableGetAnimateClassName as getAnimateClassName,
	ResizableBox,
	ToolbarButton,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockControls,
	BlockIcon,
	MediaPlaceholder,
	MediaReplaceFlow,
	RichText,
	useBlockProps,
	store as blockEditorStore,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import { useCopyToClipboard } from '@wordpress/compose';
import { __, _x } from '@wordpress/i18n';
import { file as icon } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import FileBlockInspector from './inspector';
import { browserSupportsPdfs } from './utils';
import removeAnchorTag from '../utils/remove-anchor-tag';
import { useUploadMediaFromBlobURL } from '../utils/hooks';

export const MIN_PREVIEW_HEIGHT = 200;
export const MAX_PREVIEW_HEIGHT = 2000;

function ClipboardToolbarButton( { text, disabled } ) {
	const { createNotice } = useDispatch( noticesStore );
	const ref = useCopyToClipboard( text, () => {
		createNotice( 'info', __( 'Copied URL to clipboard.' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	} );

	return (
		<ToolbarButton
			className="components-clipboard-toolbar-button"
			ref={ ref }
			disabled={ disabled }
		>
			{ __( 'Copy URL' ) }
		</ToolbarButton>
	);
}

function FileEdit( { attributes, isSelected, setAttributes, clientId } ) {
	const {
		id,
		fileName,
		href,
		textLinkHref,
		textLinkTarget,
		showDownloadButton,
		downloadButtonText,
		displayPreview,
		previewHeight,
	} = attributes;
	const [ temporaryURL, setTemporaryURL ] = useState( attributes.blob );
	const { media } = useSelect(
		( select ) => ( {
			media:
				id === undefined
					? undefined
					: select( coreStore ).getMedia( id ),
		} ),
		[ id ]
	);

	const { createErrorNotice } = useDispatch( noticesStore );
	const { toggleSelection, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	useUploadMediaFromBlobURL( {
		url: temporaryURL,
		onChange: onSelectFile,
		onError: onUploadError,
	} );

	// Note: Handle setting a default value for `downloadButtonText` via HTML API
	// when it supports replacing text content for HTML tags.
	useEffect( () => {
		if ( RichText.isEmpty( downloadButtonText ) ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				downloadButtonText: _x( 'Download', 'button label' ),
			} );
		}
		// Reason: This effect should only run on mount.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	function onSelectFile( newMedia ) {
		if ( ! newMedia || ! newMedia.url ) {
			// Reset attributes.
			setAttributes( {
				href: undefined,
				fileName: undefined,
				textLinkHref: undefined,
				id: undefined,
				fileId: undefined,
				displayPreview: undefined,
				previewHeight: undefined,
			} );
			setTemporaryURL();
			return;
		}

		if ( isBlobURL( newMedia.url ) ) {
			setTemporaryURL( newMedia.url );
			return;
		}

		const isPdf = newMedia.url.endsWith( '.pdf' );
		setAttributes( {
			href: newMedia.url,
			fileName: newMedia.title,
			textLinkHref: newMedia.url,
			id: newMedia.id,
			displayPreview: isPdf ? true : undefined,
			previewHeight: isPdf ? 600 : undefined,
			fileId: `wp-block-file--media-${ clientId }`,
			blob: undefined,
		} );
		setTemporaryURL();
	}

	function onUploadError( message ) {
		setAttributes( { href: undefined } );
		createErrorNotice( message, { type: 'snackbar' } );
	}

	function changeLinkDestinationOption( newHref ) {
		// Choose Media File or Attachment Page (when file is in Media Library).
		setAttributes( { textLinkHref: newHref } );
	}

	function changeOpenInNewWindow( newValue ) {
		setAttributes( {
			textLinkTarget: newValue ? '_blank' : false,
		} );
	}

	function changeShowDownloadButton( newValue ) {
		setAttributes( { showDownloadButton: newValue } );
	}

	function changeDisplayPreview( newValue ) {
		setAttributes( { displayPreview: newValue } );
	}

	function handleOnResizeStop( event, direction, elt, delta ) {
		toggleSelection( true );

		const newHeight = parseInt( previewHeight + delta.height, 10 );
		setAttributes( { previewHeight: newHeight } );
	}

	function changePreviewHeight( newValue ) {
		const newHeight = Math.max(
			parseInt( newValue, 10 ),
			MIN_PREVIEW_HEIGHT
		);
		setAttributes( { previewHeight: newHeight } );
	}

	const attachmentPage = media && media.link;

	const blockProps = useBlockProps( {
		className: clsx(
			!! temporaryURL && getAnimateClassName( { type: 'loading' } ),
			{
				'is-transient': !! temporaryURL,
			}
		),
	} );

	const displayPreviewInEditor = browserSupportsPdfs() && displayPreview;

	if ( ! href && ! temporaryURL ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					labels={ {
						title: __( 'File' ),
						instructions: __(
							'Upload a file or pick one from your media library.'
						),
					} }
					onSelect={ onSelectFile }
					onError={ onUploadError }
					accept="*"
				/>
			</div>
		);
	}

	return (
		<>
			<FileBlockInspector
				hrefs={ {
					href: href || temporaryURL,
					textLinkHref,
					attachmentPage,
				} }
				{ ...{
					openInNewWindow: !! textLinkTarget,
					showDownloadButton,
					changeLinkDestinationOption,
					changeOpenInNewWindow,
					changeShowDownloadButton,
					displayPreview,
					changeDisplayPreview,
					previewHeight,
					changePreviewHeight,
				} }
			/>
			<BlockControls group="other">
				<MediaReplaceFlow
					mediaId={ id }
					mediaURL={ href }
					accept="*"
					onSelect={ onSelectFile }
					onError={ onUploadError }
					onReset={ () => onSelectFile( undefined ) }
				/>
				<ClipboardToolbarButton
					text={ href }
					disabled={ isBlobURL( href ) }
				/>
			</BlockControls>
			<div { ...blockProps }>
				{ displayPreviewInEditor && (
					<ResizableBox
						size={ { height: previewHeight } }
						minHeight={ MIN_PREVIEW_HEIGHT }
						maxHeight={ MAX_PREVIEW_HEIGHT }
						minWidth="100%"
						grid={ [ 10, 10 ] }
						enable={ {
							top: false,
							right: false,
							bottom: true,
							left: false,
							topRight: false,
							bottomRight: false,
							bottomLeft: false,
							topLeft: false,
						} }
						onResizeStart={ () => toggleSelection( false ) }
						onResizeStop={ handleOnResizeStop }
						showHandle={ isSelected }
					>
						<object
							className="wp-block-file__preview"
							data={ href }
							type="application/pdf"
							aria-label={ __(
								'Embed of the selected PDF file.'
							) }
						/>
						{ ! isSelected && (
							<div className="wp-block-file__preview-overlay" />
						) }
					</ResizableBox>
				) }
				<div className="wp-block-file__content-wrapper">
					<RichText
						identifier="fileName"
						tagName="a"
						value={ fileName }
						placeholder={ __( 'Write file name…' ) }
						withoutInteractiveFormatting
						onChange={ ( text ) =>
							setAttributes( {
								fileName: removeAnchorTag( text ),
							} )
						}
						href={ textLinkHref }
					/>
					{ showDownloadButton && (
						<div className="wp-block-file__button-richtext-wrapper">
							{ /* Using RichText here instead of PlainText so that it can be styled like a button. */ }
							<RichText
								identifier="downloadButtonText"
								tagName="div" // Must be block-level or else cursor disappears.
								aria-label={ __( 'Download button text' ) }
								className={ clsx(
									'wp-block-file__button',
									__experimentalGetElementClassName(
										'button'
									)
								) }
								value={ downloadButtonText }
								withoutInteractiveFormatting
								placeholder={ __( 'Add text…' ) }
								onChange={ ( text ) =>
									setAttributes( {
										downloadButtonText:
											removeAnchorTag( text ),
									} )
								}
							/>
						</div>
					) }
				</div>
			</div>
		</>
	);
}

export default FileEdit;
