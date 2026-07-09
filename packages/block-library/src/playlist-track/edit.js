/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import { useContext, useEffect, useRef, useState } from '@wordpress/element';
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
	TextareaControl,
	BaseControl,
	Spinner,
} from '@wordpress/components';
import { Link } from '@wordpress/ui';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { PlaylistContext } from '../playlist/context';
import { getAlbumCoverAttributes } from '../playlist/utils';
import { useUploadMediaFromBlobURL } from '../utils/hooks';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];
const ALBUM_COVER_ALLOWED_MEDIA_TYPES = [ 'image' ];

const PlaylistTrackEdit = ( {
	attributes,
	setAttributes,
	context,
	clientId,
	isSelected,
} ) => {
	const { id, src, album, artist, image, imageAlt, length, title } =
		attributes;
	const [ temporaryURL, setTemporaryURL ] = useState( attributes.blob );
	const showArtists = context?.showArtists;
	const showImages = context?.showImages ?? true;
	const imageButton = useRef();
	const blockProps = useBlockProps();
	const { currentTrackClientId, setCurrentTrackClientId } =
		useContext( PlaylistContext );
	const { createErrorNotice } = useDispatch( noticesStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}
	const hasTrackSource = !! src || !! temporaryURL;

	useEffect( () => {
		if (
			isSelected &&
			hasTrackSource &&
			currentTrackClientId !== clientId
		) {
			setCurrentTrackClientId( clientId );
		}
	}, [
		isSelected,
		hasTrackSource,
		clientId,
		currentTrackClientId,
		setCurrentTrackClientId,
	] );

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
				artist: undefined,
				album: undefined,
				image: undefined,
				imageAlt: undefined,
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
			...getAlbumCoverAttributes( media?.image ),
			length: media?.fileLength || media?.media_details?.length_formatted,
			title: media.title,
		} );
		setTemporaryURL();
	}

	function onSelectAlbumCoverImage( coverImage ) {
		setAttributes( getAlbumCoverAttributes( coverImage ) );
	}

	function onRemoveAlbumCoverImage() {
		setAttributes( { image: undefined, imageAlt: undefined } );

		// Move focus back to the Media Upload button.
		imageButton.current.focus();
	}

	if ( ! hasTrackSource ) {
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
						label={ __( 'Artist' ) }
						value={ artist ? stripHTML( artist ) : '' }
						onChange={ ( artistValue ) => {
							setAttributes( { artist: artistValue } );
						} }
					/>
					<TextControl
						label={ __( 'Album' ) }
						value={ album ? stripHTML( album ) : '' }
						onChange={ ( albumValue ) => {
							setAttributes( { album: albumValue } );
						} }
					/>
					<TextControl
						label={ __( 'Title' ) }
						value={ title ? stripHTML( title ) : '' }
						onChange={ ( titleValue ) => {
							setAttributes( { title: titleValue } );
						} }
					/>
					<MediaUploadCheck>
						<BaseControl>
							<BaseControl.VisualLabel>
								{ __( 'Album cover image' ) }
							</BaseControl.VisualLabel>
							<div className="editor-video-poster-control">
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
									allowedTypes={
										ALBUM_COVER_ALLOWED_MEDIA_TYPES
									}
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
						</BaseControl>
					</MediaUploadCheck>
					{ !! image && (
						<TextareaControl
							label={ __( 'Alternative text' ) }
							value={ imageAlt || '' }
							onChange={ ( value ) =>
								setAttributes( { imageAlt: value } )
							}
							help={
								<Link
									openInNewTab
									href={
										// translators: Localized tutorial, if one exists. W3C Web Accessibility Initiative link has list of existing translations.
										__(
											'https://www.w3.org/WAI/tutorials/images/decision-tree/'
										)
									}
								>
									{ __(
										'Describe the purpose of the image.'
									) }
								</Link>
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
				{ !! temporaryURL && <Spinner /> }
				<button
					className="wp-block-playlist-track__button"
					onClick={ () => setCurrentTrackClientId( clientId ) }
					aria-current={
						currentTrackClientId === clientId ? 'true' : 'false'
					}
				>
					{ showImages && !! image && (
						<img
							className="wp-block-playlist-track__image"
							src={ image }
							alt={ imageAlt || '' }
						/>
					) }
					<span className="wp-block-playlist-track__content">
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
					</span>
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
				</button>
			</li>
		</>
	);
};

export default PlaylistTrackEdit;
