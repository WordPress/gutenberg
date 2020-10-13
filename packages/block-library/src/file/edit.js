/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { Animate, ClipboardButton, withNotices } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	BlockControls,
	BlockIcon,
	MediaPlaceholder,
	MediaReplaceFlow,
	RichText,
} from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { file as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import FileBlockInspector from './inspector';

function FileEdit( {
	className,
	isSelected,
	attributes,
	setAttributes,
	noticeUI,
	noticeOperations,
} ) {
	const {
		id,
		fileName,
		href,
		textLinkHref,
		textLinkTarget,
		showDownloadButton,
		downloadButtonText,
	} = attributes;
	const [ hasError, setHasError ] = useState( false );
	const [ showCopyConfirmation, setShowCopyConfirmation ] = useState( false );
	const { media, mediaUpload } = useSelect(
		( select ) => ( {
			media:
				id === undefined ? undefined : select( 'core' ).getMedia( id ),
			mediaUpload: select( 'core/block-editor' ).getSettings()
				.mediaUpload,
		} ),
		[ id ]
	);

	useEffect( () => {
		// Upload a file drag-and-dropped into the editor
		if ( isBlobURL( href ) ) {
			const file = getBlobByURL( href );

			mediaUpload( {
				filesList: [ file ],
				onFileChange: ( [ newMedia ] ) => onSelectFile( newMedia ),
				onError: ( message ) => {
					setHasError( true );
					noticeOperations.createErrorNotice( message );
				},
			} );

			revokeBlobURL( href );
		}

		if ( downloadButtonText === undefined ) {
			setAttributes( {
				downloadButtonText: _x( 'Download', 'button label' ),
			} );
		}
	}, [] );

	useEffect( () => {
		setShowCopyConfirmation( false );
	}, [ isSelected ] );

	function onSelectFile( newMedia ) {
		if ( newMedia && newMedia.url ) {
			setHasError( false );
			setAttributes( {
				href: newMedia.url,
				fileName: newMedia.title,
				textLinkHref: newMedia.url,
				id: newMedia.id,
			} );
		}
	}

	function onUploadError( message ) {
		setHasError( true );
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	function confirmCopyURL() {
		setShowCopyConfirmation( true );
	}

	function resetCopyConfirmation() {
		setShowCopyConfirmation( false );
	}

	function changeLinkDestinationOption( newHref ) {
		// Choose Media File or Attachment Page (when file is in Media Library)
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

	const attachmentPage = media && media.link;

	if ( ! href || hasError ) {
		return (
			<MediaPlaceholder
				icon={ <BlockIcon icon={ icon } /> }
				labels={ {
					title: __( 'File' ),
					instructions: __(
						'Upload a file or pick one from your media library.'
					),
				} }
				onSelect={ onSelectFile }
				notices={ noticeUI }
				onError={ onUploadError }
				accept="*"
			/>
		);
	}

	const classes = classnames( className, {
		'is-transient': isBlobURL( href ),
	} );

	return (
		<>
			<FileBlockInspector
				hrefs={ { href, textLinkHref, attachmentPage } }
				{ ...{
					openInNewWindow: !! textLinkTarget,
					showDownloadButton,
					changeLinkDestinationOption,
					changeOpenInNewWindow,
					changeShowDownloadButton,
				} }
			/>
			<BlockControls>
				<MediaReplaceFlow
					mediaId={ id }
					mediaURL={ href }
					accept="*"
					onSelect={ onSelectFile }
					onError={ onUploadError }
				/>
			</BlockControls>
			<Animate type={ isBlobURL( href ) ? 'loading' : null }>
				{ ( { className: animateClassName } ) => (
					<div className={ classnames( classes, animateClassName ) }>
						<div className={ 'wp-block-file__content-wrapper' }>
							<div className="wp-block-file__textlink">
								<RichText
									tagName="div" // must be block-level or else cursor disappears
									value={ fileName }
									placeholder={ __( 'Write file name…' ) }
									withoutInteractiveFormatting
									onChange={ ( text ) =>
										setAttributes( { fileName: text } )
									}
								/>
							</div>
							{ showDownloadButton && (
								<div
									className={
										'wp-block-file__button-richtext-wrapper'
									}
								>
									{ /* Using RichText here instead of PlainText so that it can be styled like a button */ }
									<RichText
										tagName="div" // must be block-level or else cursor disappears
										className={ 'wp-block-file__button' }
										value={ downloadButtonText }
										withoutInteractiveFormatting
										placeholder={ __( 'Add text…' ) }
										onChange={ ( text ) =>
											setAttributes( {
												downloadButtonText: text,
											} )
										}
									/>
								</div>
							) }
						</div>
						{ isSelected && (
							<ClipboardButton
								isSecondary
								text={ href }
								className={ 'wp-block-file__copy-url-button' }
								onCopy={ confirmCopyURL }
								onFinishCopy={ resetCopyConfirmation }
								disabled={ isBlobURL( href ) }
							>
								{ showCopyConfirmation
									? __( 'Copied!' )
									: __( 'Copy URL' ) }
							</ClipboardButton>
						) }
					</div>
				) }
			</Animate>
		</>
	);
}

export default withNotices( FileEdit );
