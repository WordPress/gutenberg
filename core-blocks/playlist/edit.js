/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	FormFileUpload,
	IconButton,
	Placeholder,
	ServerSideRender,
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

class PlaylistEdit extends Component {
	constructor() {
		super( ...arguments );

		this.initializePlaylist = this.initializePlaylist.bind( this );

		// check for if ids is set to determine edit state
		this.state = {
			editing: ! this.props.attributes.ids,
		};
	}

	initializePlaylist() {
		window.wp.playlist.initialize();
	}

	render() {
		const { attributes, setAttributes, className } = this.props;
		const { editing } = this.state;

		const onSelectMedia = ( media ) => {
			//check if there are returned media items and set attributes when there are
			if ( media && media[ 0 ].url ) {
				media = ( 1 < media.length ) ? media : [ media ];
				const ids = JSON.stringify( media.map( ( item ) => item.id ) );
				setAttributes( { ids, type: media[ 0 ].type, tracklist, artists, images } );
				this.setState( { editing: false } );
			}
		};

		const setAudio = ( [ audio ] ) => onSelectMedia( audio );

		const uploadFromFiles = ( event ) => editorMediaUpload( event.target.files, setAudio, 'audio' );

		const mediaIds = this.props.attributes.ids && this.props.attributes.ids.replace( /^\[(.+)\]$/, '$1' ).split( ',' );

		if ( editing ) {
			return (
				<Placeholder
					icon="media-audio"
					label={ __( 'Audio/Video Playlist' ) }
					instructions={ __( 'Select audio or video files from your library, or upload a new ones' ) }
					className={ className }>
					<FormFileUpload
						isLarge
						className="wp-block-audio__upload-button"
						onChange={ uploadFromFiles }
						accept="audio/*"
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					<MediaUpload
						onSelect={ onSelectMedia }
						type="audio"
						multiple
						playlist
						value={ this.props.attributes.ids }
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
					<MediaUpload
						onSelect={ onSelectMedia }
						type="audio"
						multiple
						playlist
						value={ mediaIds }
						render={ ( { open } ) => (
							<IconButton
								className="components-toolbar__control"
								label={ __( 'Edit Playlist' ) }
								icon="edit"
								onClick={ open }
							/>
						) }
					/>
					</Toolbar>
				</BlockControls>
				<figure className={ className }>
					<ServerSideRender
						block="core/playlist"
						attributes={ attributes }
						onChange={ this.initializePlaylist }
					/>
				</figure>
			</Fragment>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default PlaylistEdit;
