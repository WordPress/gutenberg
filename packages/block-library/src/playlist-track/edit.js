/**
 * To do: Enable uploading a track or album image.
 * To do: Save updated track data to the post in the media library.
 */

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import {
	MediaPlaceholder,
	MediaReplaceFlow,
	BlockIcon,
	useBlockProps,
	BlockControls,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { Button, PanelBody, TextControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

const PlaylistTrackEdit = ( { attributes, setAttributes, context } ) => {
	const { id, album, artist, image, length, title, url } = attributes;
	const showArtists = context?.showArtists;
	const blockProps = useBlockProps();
	const { createErrorNotice } = useDispatch( noticesStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}

	const onSelectTrack = useCallback(
		( media ) => {
			if ( ! media ) {
				return;
			}
			setAttributes( {
				id: media.id,
				artist:
					media.artist ||
					media?.meta?.artist ||
					__( 'Unknown artist' ),
				album:
					media.album || media?.meta?.album || __( 'Unknown album' ),
				// Prevent using the default media attachment icon as the track image.
				image:
					media?.image?.src &&
					media?.image?.src.endsWith( '/images/media/audio.svg' )
						? ''
						: media?.image?.src,
				length: media.fileLength,
				title: media.title,
				url: media.url,
			} );
		},
		[ setAttributes ]
	);

	if ( ! id ) {
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
					onSelect={ ( value ) => onSelectTrack( value ) }
					accept="audio/*"
					addToPlaylist
					mediaIds={ id }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ attributes }
					onError={ onUploadError }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Artist' ) }
						value={ artist ? stripHTML( artist ) : '' }
						onChange={ ( artistValue ) => {
							setAttributes( { artist: artistValue } );
						} }
					/>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Album' ) }
						value={ album ? stripHTML( album ) : '' }
						onChange={ ( albumValue ) => {
							setAttributes( { album: albumValue } );
						} }
					/>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Title' ) }
						value={ title ? stripHTML( title ) : '' }
						onChange={ ( titleValue ) => {
							setAttributes( { title: titleValue } );
						} }
					/>
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
				<Button
					__next40pxDefaultSize
					data-playlist-track-url={ url }
					data-playlist-track-title={ stripHTML( title ) }
					data-playlist-track-artist={ stripHTML( artist ) }
					data-playlist-track-album={ stripHTML( album ) }
					data-playlist-track-image-src={ image ?? null }
				>
					<RichText
						tagName="span"
						className="wp-block-playlist-track__title"
						value={ title }
						placeholder={ __( 'Add title' ) }
						onChange={ ( value ) =>
							setAttributes( { title: value } )
						}
						keepPlaceholderOnFocus
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
							keepPlaceholderOnFocus
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
