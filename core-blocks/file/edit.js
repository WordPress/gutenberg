/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlobByURL, revokeBlobURL } from '@wordpress/utils';
import {
	Button,
	FormFileUpload,
	IconButton,
	Placeholder,
	Toolbar,
} from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import {
	MediaUpload,
	BlockControls,
	RichText,
	editorMediaUpload,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './editor.scss';
import FileBlockInspector from './inspector';

export default class FileEdit extends Component {
	constructor() {
		super( ...arguments );

		const { href, id } = this.props.attributes;

		this.onSelectFile = this.onSelectFile.bind( this );
		this.uploadFromFiles = this.uploadFromFiles.bind( this );

		// edit component has its own attributes in the state so it can be edited
		// without setting the actual values outside of the edit UI
		this.state = {
			editing: ! href,
			href,
			attachmentPage: undefined,
		};

		const getAttachmentPageURL = ( mediaId ) => {
			return wp.apiRequest( {
				path: `/wp/v2/media/${ mediaId }`,
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
		};

		if ( id !== undefined ) {
			getAttachmentPageURL( id );
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
		const { isSelected, setAttributes } = this.props;

		// Strip line breaks caused by typing Enter key in RichText
		if ( /<br \/>/.test( fileName ) ) {
			setAttributes( {
				fileName: fileName.replace( '<br />', '' ),
			} );
		}

		// Reset filename if filename is empty on blur
		if ( ! isSelected && fileName === '' ) {
			setAttributes( { fileName: __( 'Untitled file' ) } );
		}
	}

	onSelectFile( media ) {
		const { fileName } = this.props.attributes;

		if ( media && media.url ) {
			// sets the block's attributes and updates the edit component from the
			// selected media, then switches off the editing UI
			this.props.setAttributes( {
				href: media.url,
				fileName: media.title || fileName,
				textLinkHref: media.url,
				id: media.id,
			} );
			this.setState( {
				href: media.url,
				fileName: media.title || fileName,
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
		const { fileName, textLinkHref, openInNewWindow, id } = this.props.attributes;
		const { setAttributes } = this.props;
		const { editing, href, attachmentPage } = this.state;

		const classNames = [
			this.props.className,
			`${ this.props.className }__editing`,
			this.isBlobURL( href ) ? 'is-transient' : '',
		].join( ' ' );

		const switchToEditing = () => {
			this.setState( { editing: true } );
		};

		const onSelectUrl = ( event ) => {
			event.preventDefault();

			// if url was changed
			if ( href && href !== this.props.attributes.href ) {
				setAttributes( {
					href,
					textLinkHref: href,
					id: undefined,
				} );
				this.setState( { attachmentPage: undefined } );
			}

			this.setState( { editing: false } );
			return false;
		};

		const uploadFilesFromInput = ( event ) => {
			this.uploadFromFiles( event.target.files );
		};

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

		const onChangeFileName = ( newRichTextLink ) => {
			if ( newRichTextLink.length === 0 ) {
				this.props.setAttributes( { fileName: '' } );
				return;
			}

			const firstNode = newRichTextLink[ 0 ];
			let newFileName;

			if ( typeof firstNode === 'string' ) {
				newFileName = firstNode;
			} else {
				newFileName = firstNode.props.children.trim();
			}

			this.props.setAttributes( { fileName: newFileName } );
		};

		if ( editing ) {
			return (
				<Placeholder
					icon="media-default"
					label={ __( 'File' ) }
					instructions={ __( 'Select a file from your library, or upload a new one' ) }
					className={ classNames }>
					<form onSubmit={ onSelectUrl }>
						<input
							type="url"
							className="components-placeholder__input"
							placeholder={ __( 'Enter URL of file here…' ) }
							onChange={ ( event ) => this.setState( { href: event.target.value } ) }
							value={ href || '' } />
						<Button
							isLarge
							type="submit">
							{ __( 'Use URL' ) }
						</Button>
					</form>
					<FormFileUpload
						isLarge
						className="wp-block-file__upload-button"
						onChange={ uploadFilesFromInput }
						accept="*"
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					<MediaUpload
						onSelect={ this.onSelectFile }
						type="*"
						value={ id }
						render={ ( { open } ) => (
							<Button isLarge onClick={ open }>
								{ __( 'Media Library' ) }
							</Button>
						) }
					/>
				</Placeholder>
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
				/>
				<BlockControls>
					<Toolbar>
						<IconButton
							className="components-icon-button components-toolbar__control"
							label={ __( 'Edit file' ) }
							onClick={ switchToEditing }
							icon="edit"
						/>
					</Toolbar>
				</BlockControls>
				<div className={ classNames }>
					<RichText
						tagName="span"
						className="wp-block-file__textlink"
						value={ fileName && [ this.buildRichTextLink( fileName ) ] }
						formattingControls={ [] }
						placeholder={ __( 'Write file name…' ) }
						keepPlaceholderOnFocus={ true }
						onChange={ onChangeFileName }
					/>
					<a
						href={ href }
						className="wp-block-file__button"
						download={ fileName }>
						{ __( 'Download' ) }
					</a>
				</div>
			</Fragment>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}
