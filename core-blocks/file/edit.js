/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlobByURL, revokeBlobURL } from '@wordpress/utils';
import {
	ClipboardButton,
	IconButton,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import { Component, compose, Fragment } from '@wordpress/element';
import {
	MediaUpload,
	MediaPlaceholder,
	BlockControls,
	RichText,
	editorMediaUpload,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './editor.scss';
import FileBlockInspector from './inspector';

class FileEdit extends Component {
	constructor() {
		super( ...arguments );

		const {
			href,
			showDownloadButton = true,
			buttonText = __( 'Download' ),
			id,
		} = this.props.attributes;

		this.onSelectFile = this.onSelectFile.bind( this );
		this.confirmCopyURL = this.confirmCopyURL.bind( this );

		// Initialize default values if undefined
		this.props.setAttributes( {
			showDownloadButton,
			buttonText,
		} );

		// edit component has its own attributes in the state so it can be edited
		// without setting the actual values outside of the edit UI
		this.state = {
			showPlaceholder: ! href,
			href,
			attachmentPage: undefined,
			showCopyConfirmation: false,
		};

		if ( id !== undefined ) {
			// Get Attachment Page URL
			wp.apiRequest( {
				path: `/wp/v2/media/${ id }`,
				method: 'GET',
			} )
				.then(
					( result ) => {
						this.setState( { attachmentPage: result.link } );
					},
					() => {
						this.setState( { attachmentPage: undefined } );
					}
				);
		}
	}

	componentDidMount() {
		const { href } = this.state;

		// Upload a file drag-and-dropped into the editor
		if ( this.isBlobURL( href ) ) {
			getBlobByURL( href )
				.then( ( file ) => {
					editorMediaUpload( {
						allowedType: '*',
						filesList: [ file ],
						onFileChange: ( [ media ] ) => this.onSelectFile( media ),
					} );
					revokeBlobURL( href );
				} );
		}
	}

	componentWillUnmount() {
		clearTimeout( this.dismissCopyConfirmation );
	}

	onSelectFile( media ) {
		if ( media && media.url ) {
			// sets the block's attributes and updates the edit component from the
			// selected media, then switches off the placeholder UI
			this.props.setAttributes( {
				href: media.url,
				fileName: media.title,
				textLinkHref: media.url,
				id: media.id,
			} );
			this.setState( {
				href: media.url,
				fileName: media.title,
				attachmentPage: media.link,
				showPlaceholder: false,
			} );
		}
	}

	confirmCopyURL() {
		this.setState( { showCopyConfirmation: true } );

		clearTimeout( this.dismissCopyConfirmation );
		this.dismissCopyConfirmation = setTimeout( () => {
			this.setState( { showCopyConfirmation: false } );
		}, 4000 );
	}

	isBlobURL( url = '' ) {
		return url.indexOf( 'blob:' ) === 0;
	}

	render() {
		const {
			fileName,
			textLinkHref,
			openInNewWindow,
			showDownloadButton,
			buttonText,
			id,
		} = this.props.attributes;
		const {
			className,
			isSelected,
			setAttributes,
			noticeUI,
			noticeOperations,
		} = this.props;
		const { showPlaceholder, href, attachmentPage } = this.state;

		const classNames = [
			className,
			this.isBlobURL( href ) ? 'is-transient' : '',
		].join( ' ' );

		const copyLinkToClipboard = ( e ) => {
			const selectedText = document.getSelection().toString();
			const htmlLink = `<a href="${ textLinkHref }">${ selectedText }</a>`;
			e.clipboardData.setData( 'text/plain', selectedText );
			e.clipboardData.setData( 'text/html', htmlLink );
		};

		// Choose Media File or Attachment Page (when file is in Media Library)
		const onChangeLinkDestinationOption = ( newHref ) => {
			setAttributes( { textLinkHref: newHref } );
		};

		const onChangeOpenInNewWindow = ( newValue ) => {
			setAttributes( {
				openInNewWindow: newValue ? '_blank' : false,
			} );
		};

		const onChangeShowDownloadButton = ( newValue ) => {
			setAttributes( { showDownloadButton: newValue } );
		};

		const onChangeFileName = ( text ) => {
			setAttributes( { fileName: text } );
		};

		// Make sure that fileName is string, not ['string'],
		// so it gets correctly rendered in the download attribute of <a>
		const castFileNameToString = () => {
			onChangeFileName( fileName.toString() );
		};

		if ( showPlaceholder ) {
			return (
				<MediaPlaceholder
					icon="media-default"
					labels={ {
						title: __( 'File' ),
						name: __( 'a file' ),
					} }
					onSelect={ this.onSelectFile }
					notices={ noticeUI }
					onError={ noticeOperations.createErrorNotice }
					accept="*"
					type="*"
				/>
			);
		}

		return (
			<Fragment>
				<FileBlockInspector
					href={ href }
					textLinkHref={ textLinkHref }
					attachmentPage={ attachmentPage }
					onChangeLinkDestinationOption={ onChangeLinkDestinationOption }
					openInNewWindow={ openInNewWindow }
					onChangeOpenInNewWindow={ onChangeOpenInNewWindow }
					showDownloadButton={ showDownloadButton }
					onChangeShowDownloadButton={ onChangeShowDownloadButton }
				/>
				<BlockControls>
					<Toolbar>
						<MediaUpload
							onSelect={ this.onSelectFile }
							type="*"
							value={ id }
							render={ ( { open } ) => (
								<IconButton
									className="components-toolbar__control"
									label={ __( 'Edit file' ) }
									onClick={ open }
									icon="edit"
								/>
							) }
						/>
					</Toolbar>
				</BlockControls>
				<div className={ classNames }>
					<div>
						<div
							className={ `${ className }__richtext-wrapper` }
							onBlur={ castFileNameToString }
							onCopy={ copyLinkToClipboard }
							onCut={ copyLinkToClipboard }
						>
							<RichText
								tagName="div" // must be block-level or else placeholder will fail
								className={ `${ className }__textlink` }
								value={ fileName }
								formattingControls={ [] } // disable controls
								placeholder={ __( 'Write file name…' ) }
								keepPlaceholderOnFocus
								onChange={ onChangeFileName }
							/>
						</div>
						{ showDownloadButton &&
							<div className={ `${ className }__button-richtext-wrapper` }>
								<RichText
									tagName="div" // must be block-level or else cursor disappears
									className={ `${ className }__button` }
									value={ buttonText }
									formattingControls={ [] } // disable controls
									placeholder={ __( 'Add text…' ) }
									keepPlaceholderOnFocus
									onChange={ ( text ) => setAttributes( { buttonText: text } ) }
								/>
							</div>
						}
					</div>
					{ isSelected &&
						<ClipboardButton
							isDefault
							text={ href }
							className={ `${ className }__copy-url-button` }
							onCopy={ this.confirmCopyURL }
						>
							{ this.state.showCopyConfirmation ? __( 'Copied!' ) : __( 'Copy URL' ) }
						</ClipboardButton>
					}
				</div>
			</Fragment>
		);
	}
}

export default compose( [
	withNotices,
] )( FileEdit );
