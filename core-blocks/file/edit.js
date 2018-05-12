/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
	editorMediaUpload,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './editor.scss';

export default class FileEdit extends Component {
	constructor() {
		super( ...arguments );
		// edit component has its own href in the state so it can be edited
		// without setting the actual value outside of the edit UI
		this.state = {
			editing: ! this.props.attributes.href,
			href: this.props.attributes.href,
			fileName: this.props.attributes.fileName,
		};
	}

	render() {
		const { id, textLinkHref } = this.props.attributes;
		const { setAttributes, className } = this.props;
		const { editing, href, fileName } = this.state;
		const switchToEditing = () => {
			this.setState( { editing: true } );
		};
		const onSelectFile = ( media ) => {
			if ( media && media.url ) {
				// sets the block's attribute and updates the edit component from the
				// selected media, then switches off the editing UI
				setAttributes( {
					href: media.url,
					fileName: media.title,
					textLinkHref: media.url,
					id: media.id,
				} );
				this.setState( {
					href: media.url,
					fileName: media.title,
					editing: false,
				} );
			}
		};
		const onSelectUrl = ( event ) => {
			event.preventDefault();
			if ( href ) {
				// set the block's href from the edit component's state, and switch off the editing UI
				setAttributes( { href: href, textLinkHref: href } );
				this.setState( { editing: false } );
			}
			return false;
		};
		const uploadFromFiles = ( event ) => {
			const setFile = ( [ file ] ) => onSelectFile( file );
			editorMediaUpload( event.target.files, setFile, '*' );
		};

		if ( editing ) {
			return (
				<Placeholder
					icon="media-default"
					label={ __( 'File' ) }
					instructions={ __( 'Select a file from your library, or upload a new one' ) }
					className={ className }>
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
						onChange={ uploadFromFiles }
						accept="*"
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					<MediaUpload
						onSelect={ onSelectFile }
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
				<div className={ `${ className } ${ className }__editing` }>
					<a href={ textLinkHref }>
						{ fileName }
					</a>
					<a
						href={ href }
						className="wp-block-file__button"
						download>
						{ __( 'Download' ) }
					</a>
				</div>
			</Fragment>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}
