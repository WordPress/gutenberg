/**
 * External Dependencies
 */

import { get, every } from 'lodash';

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
	InspectorControls,
	MediaPlaceholder,
	BlockControls,
	MediaUpload,
} from '@wordpress/editor';

import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import './editor.scss';

class PlaylistEdit extends Component {
	constructor() {
		super( ...arguments );

		this.initializePlaylist = this.initializePlaylist.bind( this );
		this.uploadFromFiles = this.uploadFromFiles.bind( this );
		this.onUploadFiles = this.onUploadFiles.bind( this );

		// check for if ids is set to determine edit state
		this.state = {
			isEditing: ! this.props.attributes.ids,
			hasError: false,
		};
	}

	initializePlaylist() {
		window.wp.playlist.initialize();
	}

	uploadFromFiles( event ) {
		this.onUploadFiles( event.target.files );
	}

	onUploadFiles( files ) {
		const { setAttributes, noticeOperations } = this.props;
		MediaUpload( {
			allowedType: [ 'audio', 'video' ],
			filesList: files,
			onFileChange: ( media ) => {
				const firstType = get( files, [ 0, 'mimeType' ] );
				const isConsistentType = !! firstType && every( files, ( filesMedia ) => filesMedia.mimeType === firstType );
				//validate type is consistent for playlist
				if ( ! isConsistentType ) {
					this.setState( { hasError: true } );
					noticeOperations.createErrorNotice( 'CANNOT DO THAT' );
					setAttributes( { ids: null, type: null } );
				} else if ( media.length > 0 && media[ 0 ].mimeType ) {
					const type = media[ 0 ].mimeType.split( '/' )[ 0 ];
					const ids = JSON.stringify( media.map( ( item ) => item.id ) );
					setAttributes( { ids, type } );
					this.setState( { isEditing: false, hasError: false } );
				}
			},
		} );
	}

	toggleAttribute( attribute ) {
		return ( newValue ) => {
			this.props.setAttributes( { [ attribute ]: newValue } );
		};
	}

	render() {
		const { attributes, setAttributes, className, noticeUI, noticeOperations } = this.props;
		const { isEditing, hasError } = this.state;
		const { tracklist, showTrackNumbers, showArtists, images, style, type } = attributes;

		const onSelectMedia = ( media ) => {
			//check if there are returned media items and set attributes when there are
			if ( media && media[ 0 ].url ) {
				const ids = JSON.stringify( media.map( ( item ) => item.id ) );
				setAttributes( { ids, type: media[ 0 ].type } );
				this.setState( { isEditing: false } );
			}
		};

		const mediaIds = this.props.attributes.ids && this.props.attributes.ids.replace( /^\[(.+)\]$/, '$1' ).split( ',' );

		if ( hasError ) {
			return (
				<MediaPlaceholder
					icon="format-audio"
					labels={ {
						title: __( 'Media' ),
						name: __( 'a media' ),
					} }
					className={ className }
					onSelect={ this.onSelectImage }
					notices={ noticeUI }
					onError={ noticeOperations.createErrorNotice }
					accept="audio/*,video/*"
					type="audio,video"
				/>
			);
		}

		if ( isEditing ) {
			return (
				<Placeholder
					icon="media-audio"
					label={ __( 'Audio/Video Playlist' ) }
					instructions={ __( 'Select audio or video files from your library, or upload a new ones.' ) }
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
						onSelect={ onSelectMedia }
						type={ type }
						multiple
						playlist
						notices={ this.props.noticeUI }
						value={ mediaIds }
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
							onSelect={ onSelectMedia }
							type={ type }
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
						onChange={ this.initializePlaylist }
					/>
				</figure>
			</Fragment>
		);
	}
}

export default compose( [
	withNotices,
] )( PlaylistEdit );
