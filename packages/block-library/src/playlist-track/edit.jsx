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
	PlainText,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	TextControl,
	TextareaControl as WCTextareaControl,
	BaseControl,
	Spinner,
} from '@wordpress/components';
import { Link } from '@wordpress/ui';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { PlaylistContext } from '../playlist/context';
import { getTrackAttributes, getTrackImageAttributes } from '../playlist/utils';
import { useUploadMediaFromBlobURL } from '../utils/hooks';
import { queueTrackPeaks } from '../utils/waveform-peaks';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];
const TRACK_IMAGE_ALLOWED_MEDIA_TYPES = [ 'image' ];

const PlaylistTrackEdit = ( {
	attributes,
	setAttributes,
	context,
	clientId,
	isSelected,
} ) => {
	const { id, src, album, artist, image, imageAlt, length, title, waveform } =
		attributes;
	const [ temporaryURL, setTemporaryURL ] = useState( attributes.blob );
	const showArtists = context?.showArtists;
	const showImages = context?.showImages ?? true;
	const imageButton = useRef();
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

	/**
	 * Peaks analysed from a blob URL, held until its upload finishes.
	 *
	 * Completing an upload rewrites the track's attributes wholesale, so
	 * writing the peaks straight away would only see them cleared.
	 */
	const pendingPeaksRef = useRef( null );

	// Prefer the blob: a file that is still uploading is local and always
	// readable, whereas the uploaded copy may live on another origin that
	// forbids cross-origin reads — in which case this is the only chance to
	// analyse it.
	const analysisSource = temporaryURL || src;

	useEffect( () => {
		if ( waveform || ! analysisSource ) {
			return;
		}

		let cancelled = false;

		queueTrackPeaks( analysisSource ).then( ( peaks ) => {
			// A null result means the audio could not be read or decoded. The
			// track still plays; the player falls back when it draws.
			if ( cancelled || ! peaks ) {
				return;
			}

			if ( isBlobURL( analysisSource ) ) {
				pendingPeaksRef.current = { url: analysisSource, peaks };
				return;
			}

			setAttributes( { waveform: peaks } );
		} );

		return () => {
			cancelled = true;
		};
	}, [ analysisSource, waveform, setAttributes ] );

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
				waveform: undefined,
			} );
			pendingPeaksRef.current = null;
			setTemporaryURL();
			return;
		}

		if ( isBlobURL( mediaUrl ) ) {
			setTemporaryURL( mediaUrl );
			return;
		}

		// Carry over peaks analysed from the blob, but only when they belong to
		// the upload that is completing. Selecting different media instead
		// leaves them behind, so the new audio gets analysed on its own.
		// `temporaryURL` is checked first so that the two undefined values of a
		// direct media selection cannot compare equal to each other.
		const analysedPeaks =
			temporaryURL && pendingPeaksRef.current?.url === temporaryURL
				? pendingPeaksRef.current.peaks
				: undefined;

		pendingPeaksRef.current = null;

		setAttributes( {
			blob: undefined,
			...getTrackAttributes( media ),
			...( analysedPeaks ? { waveform: analysedPeaks } : {} ),
		} );
		setTemporaryURL();
	}

	function onSelectTrackImage( trackImage ) {
		setAttributes( getTrackImageAttributes( trackImage ) );
	}

	function onRemoveTrackImage() {
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
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					{ /* Only show if this is a single selection (not multiselect) */ }
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
					<MediaUploadCheck>
						<BaseControl>
							<BaseControl.VisualLabel>
								{ __( 'Track image' ) }
							</BaseControl.VisualLabel>
							<div className="editor-video-poster-control">
								{ !! image && (
									<img
										src={ image }
										alt={ __(
											'Preview of the track image'
										) }
									/>
								) }
								<MediaUpload
									title={ __( 'Select image' ) }
									onSelect={ onSelectTrackImage }
									allowedTypes={
										TRACK_IMAGE_ALLOWED_MEDIA_TYPES
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
										onClick={ onRemoveTrackImage }
										variant="tertiary"
									>
										{ __( 'Remove' ) }
									</Button>
								) }
							</div>
						</BaseControl>
					</MediaUploadCheck>
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
							<Spinner className="wp-block-playlist-track__spinner" />
						) }
					</span>
					<span className="screen-reader-text">{ __( 'Play' ) }</span>
				</button>
			</li>
		</>
	);
};

export default PlaylistTrackEdit;
