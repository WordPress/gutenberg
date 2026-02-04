/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import { useRef, useState } from '@wordpress/element';
import {
	MediaPlaceholder,
	MediaReplaceFlow,
	MediaUpload,
	MediaUploadCheck,
	BlockIcon,
	useBlockProps,
	BlockControls,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	TextControl,
	BaseControl,
	Spinner,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { useUploadMediaFromBlobURL } from '../utils/hooks';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];
const ALBUM_COVER_ALLOWED_MEDIA_TYPES = [ 'image' ];

const PlaylistTrackEdit = ( { attributes, setAttributes, context } ) => {
	// Note that 'id' is the media attachment ID, while 'uniqueId' is a unique identifier.
	// This is to make sure that the same media can be used in more than one track.
	const { id, uniqueId, src, album, artist, image, length, title } =
		attributes;
	const [ temporaryURL, setTemporaryURL ] = useState( attributes.blob );
	const showArtists = context?.showArtists;
	const currentTrack = context?.currentTrack;
	const imageButton = useRef();
	const blockProps = useBlockProps();
	const { createErrorNotice } = useDispatch( noticesStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}

	useUploadMediaFromBlobURL( {
		src: temporaryURL,
		allowedTypes: ALLOWED_MEDIA_TYPES,
		onChange: onSelectTrack,
		onError: onUploadError,
	} );

	function onSelectTrack( media ) {
		if ( ! media || ! media.url ) {
			// In this case there was an error and we should continue in the editing state
			// previous attributes should be removed because they may be temporary blob urls.
			setAttributes( {
				blob: undefined,
				id: undefined,
				uniqueId: undefined,
				artist: undefined,
				album: undefined,
				image: undefined,
				length: undefined,
				title: undefined,
				url: undefined,
			} );
			setTemporaryURL();
			return;
		}

		if ( isBlobURL( media.url ) ) {
			setTemporaryURL( media.url );
			return;
		}

		setAttributes( {
			blob: undefined,
			id: media.id,
			uniqueId: uuid(),
			src: media.url,
			artist:
				media.artist ||
				media?.meta?.artist ||
				media?.media_details?.artist ||
				__( 'Unknown artist' ),
			album:
				media.album ||
				media?.meta?.album ||
				media?.media_details?.album ||
				__( 'Unknown album' ),
			// Prevent using the default media attachment icon as the track image.
			image:
				media?.image?.src &&
				media?.image?.src.endsWith( '/images/media/audio.svg' )
					? ''
					: media?.image?.src,
			length: media?.fileLength || media?.media_details?.length_formatted,
			title: media.title,
		} );
		setTemporaryURL();
	}

	function onSelectAlbumCoverImage( coverImage ) {
		setAttributes( { image: coverImage.url } );
	}

	function onRemoveAlbumCoverImage() {
		setAttributes( { image: undefined } );

		// Move focus back to the Media Upload button.
		imageButton.current.focus();
	}

	if ( ! src && ! temporaryURL ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					labels={ {
						title: __( 'Track' ),
						instructions: __(
							'Upload an audio file or pick one from your media library.'
						),
					} }
					onSelect={ onSelectTrack }
					accept="audio/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ attributes }
					onError={ onUploadError }
				/>
			</div>
		);
	}

	return (
		<>
			<BlockControls group="other">
				<MediaReplaceFlow
					name={ __( 'Replace' ) }
					onSelect={ onSelectTrack }
					accept="audio/*"
					mediaId={ id }
					mediaURL={ src }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					onError={ onUploadError }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Artist' ) }
						value={ artist ? stripHTML( artist ) : '' }
						onChange={ ( artistValue ) => {
							setAttributes( { artist: artistValue } );
						} }
					/>
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Album' ) }
						value={ album ? stripHTML( album ) : '' }
						onChange={ ( albumValue ) => {
							setAttributes( { album: albumValue } );
						} }
					/>
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Title' ) }
						value={ title ? stripHTML( title ) : '' }
						placeholder={ title ? stripHTML( title ) : '' }
						onChange={ ( titleValue ) => {
							setAttributes( { title: titleValue } );
						} }
					/>
					<MediaUploadCheck>
						<div className="editor-video-poster-control">
							<BaseControl.VisualLabel>
								{ __( 'Album cover image' ) }
							</BaseControl.VisualLabel>
							{ !! image && (
								<img
									src={ image }
									alt={ __(
										'Preview of the album cover image'
									) }
								/>
							) }
							<MediaUpload
								title={ __( 'Select image' ) }
								onSelect={ onSelectAlbumCoverImage }
								allowedTypes={ ALBUM_COVER_ALLOWED_MEDIA_TYPES }
								render={ ( { open } ) => (
									<Button
										__next40pxDefaultSize
										variant="primary"
										onClick={ open }
										ref={ imageButton }
									>
										{ ! image
											? __( 'Select' )
											: __( 'Replace' ) }
									</Button>
								) }
							/>
							{ !! image && (
								<Button
									__next40pxDefaultSize
									onClick={ onRemoveAlbumCoverImage }
									variant="tertiary"
								>
									{ __( 'Remove' ) }
								</Button>
							) }
						</div>
					</MediaUploadCheck>
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
				{ !! temporaryURL && <Spinner /> }
				<Button
					className="wp-block-playlist-track__button"
					__next40pxDefaultSize
					data-wp-context={ JSON.stringify( { uniqueId } ) }
					aria-current={
						currentTrack === uniqueId ? 'true' : 'false'
					}
				>
					<RichText
						tagName="span"
						className="wp-block-playlist-track__title"
						value={ title }
						placeholder={ __( 'Add title' ) }
						onChange={ ( value ) => {
							setAttributes( { title: value } );
						} }
						allowedFormats={ [] }
						withoutInteractiveFormatting
					/>
					{ showArtists && (
						<RichText
							tagName="span"
							className="wp-block-playlist-track__artist"
							value={ artist }
							placeholder={ __( 'Add artist' ) }
							onChange={ ( value ) =>
								setAttributes( { artist: value } )
							}
							allowedFormats={ [] }
							withoutInteractiveFormatting
						/>
					) }
					<span className="wp-block-playlist-track__length">
						{ length && (
							<span className="screen-reader-text">
								{
									/* translators: %s: Visually hidden label for the track length (screen reader text). */
									__( 'Length:' )
								}
							</span>
						) }
						{ length }
					</span>
					<span className="screen-reader-text">
						{ __( 'Select to play this track' ) }
					</span>
				</Button>
			</li>
		</>
	);
};

export default PlaylistTrackEdit;
