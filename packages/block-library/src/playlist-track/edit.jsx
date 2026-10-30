import { isBlobURL } from '@wordpress/blob';
import { useContext, useEffect, useState } from '@wordpress/element';
import {
	MediaPlaceholder,
	MediaReplaceFlow,
	BlockIcon,
	useBlockProps,
	BlockControls,
	InspectorControls,
	PlainText,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	TextareaControl as WCTextareaControl,
	BaseControl,
	Spinner as WCSpinner,
} from '@wordpress/components';
import { Link } from '@wordpress/ui';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { getFilename } from '@wordpress/url';
import { PlaylistContext } from '../playlist/context';
import { getTrackAttributes, getTrackImageAttributes } from '../playlist/utils';
import { useUploadMediaFromBlobURL } from '../utils/hooks';
import { MediaControl } from '../utils/media-control';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];
const TRACK_IMAGE_ALLOWED_MEDIA_TYPES = [ 'image' ];

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
	const blockProps = useBlockProps();
	const { currentTrackClientId, setCurrentTrackClientId, removeTrack } =
		useContext( PlaylistContext );
	const { createErrorNotice } = useDispatch( noticesStore );

	/**
	 * Handle audio upload errors.
	 *
	 * @param {string}  message                      Error message to show.
	 * @param {Object}  [options]
	 * @param {boolean} [options.removeTrackOnError] Remove the track as well. Useful for drag/drop where a track is optimistically created before upload finishes.
	 */
	function onUploadError( message, { removeTrackOnError = false } = {} ) {
		createErrorNotice( message, { type: 'snackbar' } );

		if ( removeTrackOnError ) {
			removeTrack( clientId );
			return;
		}

		// Set temporaryURL back to default state
		setTemporaryURL();
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

	// Handles drag/drop uploads
	useUploadMediaFromBlobURL( {
		url: temporaryURL,
		allowedTypes: ALLOWED_MEDIA_TYPES,
		onChange: onSelectTrack,
		onError: ( message ) => {
			onUploadError( message, { removeTrackOnError: true } );
		},
	} );

	function onSelectTrack( media ) {
		const mediaUrl = media?.url ?? media?.source_url;

		if ( ! media || ! mediaUrl ) {
			// The upload failed. Only clear the temporary blob URL, so a failed
			// replacement leaves the current track and its details intact.
			setAttributes( { blob: undefined } );
			setTemporaryURL();
			return;
		}

		if ( isBlobURL( mediaUrl ) ) {
			setTemporaryURL( mediaUrl );
			return;
		}

		setAttributes( {
			blob: undefined,
			...getTrackAttributes( media ),
		} );
		setTemporaryURL();
	}

	function onSelectTrackImage( trackImage ) {
		setAttributes( getTrackImageAttributes( trackImage ) );
	}

	function onRemoveTrackImage() {
		setAttributes( { image: undefined, imageAlt: undefined } );
	}

	function onTrackImageUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
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
			{ /* Only show if this is a single selection (not multiselect) */ }
			{ isSelected && (
				<BlockControls group="other">
					<MediaReplaceFlow
						name={ __( 'Replace' ) }
						onSelect={ onSelectTrack }
						accept="audio/*"
						mediaId={ id }
						mediaURL={ src }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						onError={ onUploadError }
						variant="toolbar"
					/>
				</BlockControls>
			) }
			<InspectorControls group="content">
				<PanelBody title={ __( 'Settings' ) }>
					{ /* Only show if this is a single selection (not multiselect) */ }
					{ isSelected && (
						<BaseControl>
							<BaseControl.VisualLabel>
								{ __( 'Track' ) }
							</BaseControl.VisualLabel>
							<MediaControl
								mediaId={ id }
								mediaUrl={ src }
								filename={ getFilename( src ) }
								allowedTypes={ ALLOWED_MEDIA_TYPES }
								onSelect={ onSelectTrack }
								onError={ onUploadError }
								emptyLabel={ __( 'Add track' ) }
							/>
						</BaseControl>
					) }
					<BaseControl>
						<BaseControl.VisualLabel>
							{ __( 'Track image' ) }
						</BaseControl.VisualLabel>
						<MediaControl
							mediaUrl={ image }
							filename={
								image ? getFilename( image ) : undefined
							}
							allowedTypes={ TRACK_IMAGE_ALLOWED_MEDIA_TYPES }
							onSelect={ onSelectTrackImage }
							onError={ onTrackImageUploadError }
							onReset={ onRemoveTrackImage }
							emptyLabel={ __( 'Add image' ) }
						/>
					</BaseControl>
					{ !! image && (
						<WCTextareaControl
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
					{ isSelected && (
						<TextControl
							label={ __( 'Title' ) }
							value={ title ? stripHTML( title ) : '' }
							onChange={ ( titleValue ) => {
								setAttributes( { title: titleValue } );
							} }
						/>
					) }
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
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
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
						<PlainText
							tagName="span"
							className="wp-block-playlist-track__title"
							value={ title }
							aria-label={ __( 'Track title' ) }
							placeholder={ __( 'Track title' ) }
							onChange={ ( value ) => {
								setAttributes( { title: value } );
							} }
							__experimentalVersion={ 2 }
						/>
						{ showArtists && (
							<PlainText
								tagName="span"
								className="wp-block-playlist-track__artist"
								value={ artist }
								aria-label={ __( 'Track artist' ) }
								placeholder={ __( 'Track artist' ) }
								onChange={ ( value ) =>
									setAttributes( { artist: value } )
								}
								__experimentalVersion={ 2 }
							/>
						) }
					</span>
					<span className="wp-block-playlist-track__length">
						{ length && (
							<span className="screen-reader-text">
								{
									/* translators: Visually hidden label for the track duration (screen reader text). */
									__( 'Duration:' )
								}
							</span>
						) }
						{ length }
						{ !! temporaryURL && (
							<WCSpinner className="wp-block-playlist-track__spinner" />
						) }
					</span>
					<span className="screen-reader-text">{ __( 'Play' ) }</span>
				</button>
			</li>
		</>
	);
};

export default PlaylistTrackEdit;
