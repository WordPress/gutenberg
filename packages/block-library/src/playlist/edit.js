/**
 * External Dependencies
 */
import { uniqBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	FormFileUpload,
	IconButton,
	Placeholder,
	ServerSideRender,
	Toolbar,
	withNotices,
	CheckboxControl,
	PanelBody,
	SelectControl,
} from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	mediaUpload,
	MediaUpload,
} from '@wordpress/editor';

function loadScript() {
	return new Promise( ( resolve, reject ) => {
		const scriptName = 'wp-playlist';

		const script = document.createElement( 'script' );
		script.src = `${ wpApiSettings.schema.url }/wp-admin/load-scripts.php?load=${ scriptName }`;
		script.onload = resolve;
		script.onerror = reject;

		document.head.appendChild( script );
	} );
}

function loadStyle() {
	return new Promise( ( resolve, reject ) => {
		const scriptName = 'wp-mediaelement';

		const style = document.createElement( 'link' );
		style.rel = 'stylesheet';
		style.href = `${ wpApiSettings.schema.url }/wp-admin/load-styles.php?load=${ scriptName }`;
		style.onload = resolve;
		style.onerror = reject;

		document.head.appendChild( style );
	} );
}

let hasAlreadyLoadedAssets = false;

function loadAssets() {
	if ( hasAlreadyLoadedAssets ) {
		return Promise.resolve();
	}

	return Promise.all( [ loadScript(), loadStyle() ] ).then( () => {
		hasAlreadyLoadedAssets = true;
	} );
}

/**
  * The function is used after the editor has enqueued playlist dependencies.
  *
  * @param  {function} initializePlaylist Function that Initializes playlist
  */

function initializePlaylist() {
	loadAssets().then( () => {
		wp.playlist.initialize();
	} );
}

class PlaylistEdit extends Component {
	constructor() {
		super( ...arguments );

		this.uploadFromFiles = this.uploadFromFiles.bind( this );
		this.onUploadFiles = this.onUploadFiles.bind( this );
		this.onSelectMedia = this.onSelectMedia.bind( this );
		this.getMimeBaseType = this.getMimeBaseType.bind( this );
	}

	uploadFromFiles( event ) {
		const { noticeOperations } = this.props;
		if ( ! event.target.files ) {
			noticeOperations.createErrorNotice( __( 'Files list provided is empty' ) );
			return;
		}
		this.onUploadFiles( event.target.files );
	}

	getMimeBaseType( type ) {
		const { noticeOperations } = this.props;
		if ( ! type ) {
			noticeOperations.createErrorNotice( __( 'MIME type could not be determined' ) );
			return;
		}
		return type.split( '/' )[ 0 ];
	}

	onUploadFiles( files ) {
		const { setAttributes, noticeOperations } = this.props;
		const isConsistentType = uniqBy( files, ( file ) => this.getMimeBaseType( file.type ) ).length === 1;
		if ( ! isConsistentType ) {
			noticeOperations.createErrorNotice( __( 'Cannot have mixed types in a Playlist Block' ) );
			setAttributes( { ids: undefined, type: undefined } );
			return;
		}

		mediaUpload( {
			allowedType: [ 'audio', 'video' ],
			filesList: files,
			onFileChange: ( media ) => {
				// validate type is consistent for playlist
				if ( media.length > 0 && media[ 0 ].mimeType && isConsistentType ) {
					const type = media[ 0 ].mimeType.split( '/' )[ 0 ];
					const ids = media.map( ( item ) => item.id );
					setAttributes( { ids, type } );
				}
			},
		} );
	}

	toggleAttribute( attribute ) {
		return ( newValue ) => {
			this.props.setAttributes( { [ attribute ]: newValue } );
		};
	}

	onSelectMedia( media ) {
		const { setAttributes } = this.props;
		//check if there are returned media items and set attributes when there are
		const ids = media.map( ( item ) => item.id );
		setAttributes( { ids, type: media[ 0 ].type } );
	}

	render() {
		const { attributes, className, noticeUI } = this.props;
		const { tracklist, showTrackNumbers, showArtists, images, style, type } = attributes;

		if ( ! this.props.attributes.ids ) {
			return (
				<Placeholder
					icon="media-audio"
					label={ __( 'Audio/Video Playlist' ) }
					notices={ noticeUI }
					instructions={ __( 'Select audio or video files from your library, or upload new ones.' ) }
					className={ className }>
					<FormFileUpload
						isLarge
						multiple
						className="wp-block-playlist__upload-button"
						onChange={ this.uploadFromFiles }
						accept="audio/*,video/*"
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					<MediaUpload
						onSelect={ this.onSelectMedia }
						type={ type }
						multiple
						playlist
						value={ attributes.ids }
						render={ ( { open } ) => (
							<IconButton
								isLarge
								icon="edit"
								label={ __( 'Media Library' ) }
								onClick={ open }
							>
								{ __( 'Media Library' ) }
							</IconButton>
						) }
					/>
				</Placeholder>
			);
		}

		return (
			<Fragment>
				<BlockControls>
					<Toolbar>
						<MediaUpload
							onSelect={ this.onSelectMedia }
							type={ type }
							multiple
							playlist
							value={ attributes.ids }
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
				<InspectorControls>
					<PanelBody title={ __( 'Playback Controls' ) }>
						<CheckboxControl
							label={ __( 'Show Tracklist' ) }
							onChange={ this.toggleAttribute( 'tracklist' ) }
							checked={ tracklist }
						/>
						<CheckboxControl
							label={ __( 'Show Artist Name in Tracklist' ) }
							onChange={ this.toggleAttribute( 'showArtists' ) }
							checked={ showArtists }
						/>
						<CheckboxControl
							label={ __( 'Show Images' ) }
							onChange={ this.toggleAttribute( 'images' ) }
							checked={ images }
						/>
						<CheckboxControl
							label={ __( 'Show Track Numbers' ) }
							onChange={ this.toggleAttribute( 'showTrackNumbers' ) }
							checked={ showTrackNumbers }
						/>
						<SelectControl
							label={ __( 'Playlist Style' ) }
							value={ style }
							onChange={ this.toggleAttribute( 'style' ) }
							options={ [
								{ value: 'light', label: __( 'Light' ) },
								{ value: 'dark', label: __( 'Dark' ) },
							] }
						/>
					</PanelBody>
				</InspectorControls>
				<figure className={ className }>
					<ServerSideRender
						block="core/playlist"
						attributes={ attributes }
						onChange={ initializePlaylist }
					/>
				</figure>
			</Fragment>
		);
	}
}

export default withNotices( PlaylistEdit );
