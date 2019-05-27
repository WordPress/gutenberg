/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	getBlobByURL,
	isBlobURL,
	revokeBlobURL,
} from '@wordpress/blob';
import {
	ClipboardButton,
	IconButton,
	Path,
	Rect,
	SVG,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import {
	BlockControls,
	BlockIcon,
	MediaPlaceholder,
	RichText,
} from '@wordpress/block-editor';
import { mediaUpload } from '@wordpress/editor';
import { Component } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import icon from './icon';
import FileBlockInspector from './inspector';

class FileEdit extends Component {
	constructor( { attributes } ) {
		super( ...arguments );

		this.onSelectFile = this.onSelectFile.bind( this );
		this.onSelectURL = this.onSelectURL.bind( this );
		this.toggleIsEditing = this.toggleIsEditing.bind( this );
		this.confirmCopyURL = this.confirmCopyURL.bind( this );
		this.resetCopyConfirmation = this.resetCopyConfirmation.bind( this );
		this.changeLinkDestinationOption = this.changeLinkDestinationOption.bind( this );
		this.changeOpenInNewWindow = this.changeOpenInNewWindow.bind( this );
		this.changeShowDownloadButton = this.changeShowDownloadButton.bind( this );

		this.state = {
			hasError: false,
			showCopyConfirmation: false,
			isEditing: ! attributes.href,
		};
	}

	componentDidMount() {
		const { attributes, noticeOperations, setAttributes } = this.props;
		const { downloadButtonText, href } = attributes;

		// Upload a file drag-and-dropped into the editor
		if ( isBlobURL( href ) ) {
			const file = getBlobByURL( href );

			mediaUpload( {
				filesList: [ file ],
				onFileChange: ( [ media ] ) => this.onSelectFile( media ),
				onError: ( message ) => {
					this.setState( { hasError: true } );
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
	}

	componentDidUpdate( prevProps ) {
		// Reset copy confirmation state when block is deselected
		if ( prevProps.isSelected && ! this.props.isSelected ) {
			this.setState( { showCopyConfirmation: false } );
		}
	}

	onSelectFile( media ) {
		if ( media && media.url ) {
			this.setState( {
				hasError: false,
				isEditing: false,
			} );
			this.props.setAttributes( {
				href: media.url,
				fileName: media.title,
				textLinkHref: media.url,
				id: media.id,
			} );
		}
	}

	onSelectURL( newURL ) {
		const { href } = this.props.attributes;

		if ( newURL !== href ) {
			this.props.setAttributes( {
				href: newURL,
				id: undefined,
				fileName: newURL,
				textLinkHref: newURL,
			} );
		}

		this.setState( {
			isEditing: false,
		} );
	}

	toggleIsEditing() {
		this.setState( {
			isEditing: ! this.state.isEditing,
		} );
		if ( this.state.isEditing ) {
			speak( __( 'You are now viewing the image in the image block.' ) );
		} else {
			speak( __( 'You are now editing the image in the image block.' ) );
		}
	}

	confirmCopyURL() {
		this.setState( { showCopyConfirmation: true } );
	}

	resetCopyConfirmation() {
		this.setState( { showCopyConfirmation: false } );
	}

	changeLinkDestinationOption( newHref ) {
		// Choose Media File or Attachment Page (when file is in Media Library)
		this.props.setAttributes( { textLinkHref: newHref } );
	}

	changeOpenInNewWindow( newValue ) {
		this.props.setAttributes( {
			textLinkTarget: newValue ? '_blank' : false,
		} );
	}

	changeShowDownloadButton( newValue ) {
		this.props.setAttributes( { showDownloadButton: newValue } );
	}

	render() {
		const {
			className,
			isSelected,
			attributes,
			setAttributes,
			noticeUI,
			noticeOperations,
			media,
		} = this.props;
		const {
			fileName,
			href,
			textLinkHref,
			textLinkTarget,
			showDownloadButton,
			downloadButtonText,
		} = attributes;
		const { hasError, showCopyConfirmation, isEditing } = this.state;
		const attachmentPage = media && media.link;
		const editImageIcon = ( <SVG width={ 20 } height={ 20 } viewBox="0 0 20 20"><Rect x={ 11 } y={ 3 } width={ 7 } height={ 5 } rx={ 1 } /><Rect x={ 2 } y={ 12 } width={ 7 } height={ 5 } rx={ 1 } /><Path d="M13,12h1a3,3,0,0,1-3,3v2a5,5,0,0,0,5-5h1L15,9Z" /><Path d="M4,8H3l2,3L7,8H6A3,3,0,0,1,9,5V3A5,5,0,0,0,4,8Z" /></SVG> );

		if ( isEditing || hasError ) {
			return (
				<>
					<BlockControls>
						<Toolbar>
							{ !! href && ( <IconButton
								className={ 'components-toolbar__control is-active' }
								aria-pressed={ this.state.isEditing }
								label={ __( 'Edit file' ) }
								onClick={ this.toggleIsEditing }
								icon={ editImageIcon }
							/> ) }
						</Toolbar>
					</BlockControls>
					<MediaPlaceholder
						icon={ <BlockIcon icon={ icon } /> }
						labels={ {
							title: __( 'File' ),
							instructions: __( 'Drag a file, upload a new one or select a file from your library.' ),
						} }
						onSelect={ this.onSelectFile }
						onSelectURL={ this.onSelectURL }
						onCancel={ !! href && this.toggleIsEditing }
						notices={ noticeUI }
						onError={ noticeOperations.createErrorNotice }
						accept="*"
					/>
				</>
			);
		}

		const classes = classnames( className, {
			'is-transient': isBlobURL( href ),
		} );

		return (
			<>
				<BlockControls>
					<Toolbar>
						<IconButton
							className={ 'components-toolbar__control' }
							label={ __( 'Edit file' ) }
							onClick={ this.toggleIsEditing }
							icon={ editImageIcon }
						/>
					</Toolbar>
				</BlockControls>
				<FileBlockInspector
					hrefs={ { href, textLinkHref, attachmentPage } }
					{ ...{
						openInNewWindow: !! textLinkTarget,
						showDownloadButton,
						changeLinkDestinationOption: this.changeLinkDestinationOption,
						changeOpenInNewWindow: this.changeOpenInNewWindow,
						changeShowDownloadButton: this.changeShowDownloadButton,
					} }
				/>
				<div className={ classes }>
					<div className={ 'wp-block-file__content-wrapper' }>
						<RichText
							wrapperClassName={ 'wp-block-file__textlink' }
							tagName="div" // must be block-level or else cursor disappears
							value={ fileName }
							placeholder={ __( 'Write file name…' ) }
							keepPlaceholderOnFocus
							formattingControls={ [] } // disable controls
							onChange={ ( text ) => setAttributes( { fileName: text } ) }
						/>
						{ showDownloadButton &&
							<div className={ 'wp-block-file__button-richtext-wrapper' }>
								{ /* Using RichText here instead of PlainText so that it can be styled like a button */ }
								<RichText
									tagName="div" // must be block-level or else cursor disappears
									className={ 'wp-block-file__button' }
									value={ downloadButtonText }
									formattingControls={ [] } // disable controls
									placeholder={ __( 'Add text…' ) }
									keepPlaceholderOnFocus
									onChange={ ( text ) => setAttributes( { downloadButtonText: text } ) }
								/>
							</div>
						}
					</div>
					{ isSelected &&
						<ClipboardButton
							isDefault
							text={ href }
							className={ 'wp-block-file__copy-url-button' }
							onCopy={ this.confirmCopyURL }
							onFinishCopy={ this.resetCopyConfirmation }
							disabled={ isBlobURL( href ) }
						>
							{ showCopyConfirmation ? __( 'Copied!' ) : __( 'Copy URL' ) }
						</ClipboardButton>
					}
				</div>
			</>
		);
	}
}

export default compose( [
	withSelect( ( select, props ) => {
		const { getMedia } = select( 'core' );
		const { id } = props.attributes;
		return {
			media: id === undefined ? undefined : getMedia( id ),
		};
	} ),
	withNotices,
] )( FileEdit );
