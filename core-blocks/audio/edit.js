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
import { editorMediaUpload } from '@wordpress/blocks';
import {
	MediaUpload,
	RichText,
	BlockControls,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './editor.scss';

export default class AudioEdit extends Component {
	constructor() {
		super( ...arguments );
		// edit component has its own src in the state so it can be edited
		// without setting the actual value outside of the edit UI
		this.state = {
			editing: ! this.props.attributes.src,
			src: this.props.attributes.src,
		};
	}

	render() {
		const { caption, id } = this.props.attributes;
		const { setAttributes, isSelected, className } = this.props;
		const { editing, src } = this.state;
		const switchToEditing = () => {
			this.setState( { editing: true } );
		};
		const onSelectAudio = ( media ) => {
			if ( media && media.url ) {
				// sets the block's attribute and updates the edit component from the
				// selected media, then switches off the editing UI
				setAttributes( { src: media.url, id: media.id } );
				this.setState( { src: media.url, editing: false } );
			}
		};
		const onSelectUrl = ( event ) => {
			event.preventDefault();
			if ( src ) {
				// set the block's src from the edit component's state, and switch off the editing UI
				setAttributes( { src } );
				this.setState( { editing: false } );
			}
			return false;
		};
		const setAudio = ( [ audio ] ) => onSelectAudio( audio );
		const uploadFromFiles = ( event ) => editorMediaUpload( event.target.files, setAudio, 'audio' );

		if ( editing ) {
			return (
				<Placeholder
					icon="media-audio"
					label={ __( 'Audio' ) }
					instructions={ __( 'Select an audio file from your library, or upload a new one' ) }
					className={ className }>
					<form onSubmit={ onSelectUrl }>
						<input
							type="url"
							className="components-placeholder__input"
							placeholder={ __( 'Enter URL of audio file here…' ) }
							onChange={ ( event ) => this.setState( { src: event.target.value } ) }
							value={ src || '' } />
						<Button
							isLarge
							type="submit">
							{ __( 'Use URL' ) }
						</Button>
					</form>
					<FormFileUpload
						isLarge
						className="wp-block-audio__upload-button"
						onChange={ uploadFromFiles }
						accept="audio/*"
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					<MediaUpload
						onSelect={ onSelectAudio }
						type="audio"
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
							label={ __( 'Edit audio' ) }
							onClick={ switchToEditing }
							icon="edit"
						/>
					</Toolbar>
				</BlockControls>
				<figure className={ className }>
					<audio controls="controls" src={ src } />
					{ ( ( caption && caption.length ) || !! isSelected ) && (
						<RichText
							tagName="figcaption"
							placeholder={ __( 'Write caption…' ) }
							value={ caption }
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							inlineToolbar
						/>
					) }
				</figure>
			</Fragment>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}
