/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlobByURL, revokeBlobURL } from '@wordpress/utils';
import {
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
		this.uploadFromFiles = this.uploadFromFiles.bind( this );

		// Initialize default values if undefined
		this.props.setAttributes( {
			showDownloadButton,
			buttonText,
		} );

		// edit component has its own attributes in the state so it can be edited
		// without setting the actual values outside of the edit UI
		this.state = {
			editing: ! href,
			href,
			attachmentPage: undefined,
			isCompositing: false, // for filtering premature onChange events in CJK
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

		if ( this.isBlobURL( href ) ) {
			getBlobByURL( href )
				.then( ( file ) => {
					this.uploadFromFiles( [ file ] );
					revokeBlobURL( href );
				} );
		}
	}

	componentDidUpdate() {
		const { fileName } = this.props.attributes;

		// Strip line breaks caused by typing Enter key in RichText
		if ( typeof fileName === 'object' ) {
			const strings = fileName.filter( ( el ) => typeof el === 'string' );
			this.props.setAttributes( {
				fileName: strings.join( '' ).trim(),
			} );
		}
	}

	onSelectFile( media ) {
		if ( media && media.url ) {
			// sets the block's attributes and updates the edit component from the
			// selected media, then switches off the editing UI
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
				editing: false,
			} );
		}
	}

	uploadFromFiles( files ) {
		editorMediaUpload( files, ( [ media ] ) => this.onSelectFile( media ), '*' );
	}

	isBlobURL( url = '' ) {
		return url.indexOf( 'blob:' ) === 0;
	}

	buildRichTextLink( innerText ) {
		const { textLinkHref, openInNewWindow } = this.props.attributes;
		return (
			<a
				href={ textLinkHref }
				target={ openInNewWindow }
				rel={ openInNewWindow ? 'noreferrer noopener' : false }
			>
				{ innerText }
			</a>
		);
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
		const { setAttributes, noticeUI, noticeOperations } = this.props;
		const { editing, href, attachmentPage, isCompositing } = this.state;

		const classNames = [
			this.props.className,
			`${ this.props.className }__editing`,
			this.isBlobURL( href ) ? 'is-transient' : '',
		].join( ' ' );

		// Choose Media File or Attachment Page (when file is in Media Library)
		const onChangeLinkDestinationOption = ( newHref ) => {
			setAttributes( {
				textLinkHref: newHref,
			} );
		};

		const onChangeOpenInNewWindow = ( newValue ) => {
			setAttributes( {
				openInNewWindow: newValue ? '_blank' : false,
			} );
		};

		const onChangeShowDownloadButton = ( newValue ) => {
			setAttributes( {
				showDownloadButton: newValue,
			} );
		};

		// Extract filename from RichText content and update attribute
		const onChangeFileName = ( newRichTextLink ) => {
			if ( isCompositing ) {
				return; // ignore onChange events while composing in CJK
			}

			if ( newRichTextLink.length === 0 ) {
				this.props.setAttributes( { fileName: '' } );
				return;
			}

			const firstNode = newRichTextLink[ 0 ];
			let newFileName;

			if ( typeof firstNode === 'string' ) {
				newFileName = firstNode;
			} else {
				newFileName = firstNode.props.children;
			}

			this.props.setAttributes( { fileName: newFileName } );
		};

		if ( editing ) {
			return (
				<MediaPlaceholder
					icon="media-default"
					labels={ {
						title: __( 'File' ),
						name: __( 'a file' ),
					} }
					className={ classNames }
					onSelect={ this.onSelectFile }
					notices={ noticeUI }
					onError={ noticeOperations.createErrorNotice }
					accept="*"
					type="*"
				/>
			);
		}

		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
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
									className="components-icon-button components-toolbar__control"
									label={ __( 'Edit file' ) }
									onClick={ open }
									icon="edit"
								/>
							) }
						/>
					</Toolbar>
				</BlockControls>
				<div className={ classNames }>
					<div // listens if user is in the middle of compositing in CJK
						className="wp-block-file__richtext-wrapper"
						onCompositionStart={ () => this.setState( { isCompositing: true } ) }
						onCompositionEnd={ ( event ) => {
							this.setState( { isCompositing: false } );
							setAttributes( { fileName: event.target.innerText } );
						} }
					>
						<RichText
							tagName="div" // must be div (not span) or else cursor disappears
							className="wp-block-file__textlink"
							value={ fileName && [ this.buildRichTextLink( fileName ) ] }
							formattingControls={ [] } // disable controls
							placeholder={ __( 'Write file name…' ) }
							keepPlaceholderOnFocus={ ! isCompositing } // hide when CJK typing starts
							onChange={ onChangeFileName }
						/>
					</div>
					{ showDownloadButton &&
						<div className="wp-block-file__button-richtext-wrapper">
							<RichText
								tagName="div"
								className="wp-block-file__button"
								value={ buttonText }
								formattingControls={ [] } // disable controls
								onChange={ ( text ) => setAttributes( { buttonText: text } ) }
								placeholder={ __( 'Add text…' ) }
								keepPlaceholderOnFocus
							/>
						</div>
					}
				</div>
			</Fragment>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default compose( [
	withNotices,
] )( FileEdit );
