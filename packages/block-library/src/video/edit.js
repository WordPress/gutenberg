/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import {
	BaseControl,
	Button,
	Disabled,
	PanelBody,
	Spinner,
	Placeholder,
} from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
	MediaReplaceFlow,
	useBlockProps,
} from '@wordpress/block-editor';
import { useRef, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { video as icon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { createUpgradedEmbedBlock } from '../embed/util';
import { useUploadMediaFromBlobURL } from '../utils/hooks';
import VideoCommonSettings from './edit-common-settings';
import TracksEditor from './tracks-editor';
import Tracks from './tracks';
import { Caption } from '../utils/caption';

// Much of this description is duplicated from MediaPlaceholder.
const placeholder = ( content ) => {
	return (
		<Placeholder
			className="block-editor-media-placeholder"
			withIllustration
			icon={ icon }
			label={ __( 'Video' ) }
			instructions={ __(
				'Upload a video file, pick one from your media library, or add one with a URL.'
			) }
		>
			{ content }
		</Placeholder>
	);
};

const ALLOWED_MEDIA_TYPES = [ 'video' ];
const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

function VideoEdit( {
	isSelected: isSingleSelected,
	attributes,
	className,
	setAttributes,
	insertBlocksAfter,
	onReplace,
} ) {
	const instanceId = useInstanceId( VideoEdit );
	const videoPlayer = useRef();
	const posterImageButton = useRef();
	const { id, controls, poster, src, tracks } = attributes;
	const [ temporaryURL, setTemporaryURL ] = useState( attributes.blob );

	useUploadMediaFromBlobURL( {
		url: temporaryURL,
		allowedTypes: ALLOWED_MEDIA_TYPES,
		onChange: onSelectVideo,
		onError: onUploadError,
	} );

	useEffect( () => {
		// Placeholder may be rendered.
		if ( videoPlayer.current ) {
			videoPlayer.current.load();
		}
	}, [ poster ] );

	function onSelectVideo( media ) {
		if ( ! media || ! media.url ) {
			// In this case there was an error
			// previous attributes should be removed
			// because they may be temporary blob urls.
			setAttributes( {
				src: undefined,
				id: undefined,
				poster: undefined,
				caption: undefined,
				blob: undefined,
			} );
			setTemporaryURL();
			return;
		}

		if ( isBlobURL( media.url ) ) {
			setTemporaryURL( media.url );
			return;
		}

		// Sets the block's attribute and updates the edit component from the
		// selected media.
		setAttributes( {
			blob: undefined,
			src: media.url,
			id: media.id,
			poster:
				media.image?.src !== media.icon ? media.image?.src : undefined,
			caption: media.caption,
		} );
		setTemporaryURL();
	}

	function onSelectURL( newSrc ) {
		if ( newSrc !== src ) {
			// Check if there's an embed block that handles this URL.
			const embedBlock = createUpgradedEmbedBlock( {
				attributes: { url: newSrc },
			} );
			if ( undefined !== embedBlock && onReplace ) {
				onReplace( embedBlock );
				return;
			}
			setAttributes( {
				blob: undefined,
				src: newSrc,
				id: undefined,
				poster: undefined,
			} );
			setTemporaryURL();
		}
	}

	const { createErrorNotice } = useDispatch( noticesStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}

	const classes = clsx( className, {
		'is-transient': !! temporaryURL,
	} );

	const blockProps = useBlockProps( {
		className: classes,
	} );

	if ( ! src && ! temporaryURL ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					onSelect={ onSelectVideo }
					onSelectURL={ onSelectURL }
					accept="video/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ attributes }
					onError={ onUploadError }
					placeholder={ placeholder }
				/>
			</div>
		);
	}

	function onSelectPoster( image ) {
		setAttributes( { poster: image.url } );
	}

	function onRemovePoster() {
		setAttributes( { poster: undefined } );

		// Move focus back to the Media Upload button.
		posterImageButton.current.focus();
	}

	const videoPosterDescription = `video-block__poster-image-description-${ instanceId }`;

	return (
		<>
			{ isSingleSelected && (
				<>
					<BlockControls>
						<TracksEditor
							tracks={ tracks }
							onChange={ ( newTracks ) => {
								setAttributes( { tracks: newTracks } );
							} }
						/>
					</BlockControls>
					<BlockControls group="other">
						<MediaReplaceFlow
							mediaId={ id }
							mediaURL={ src }
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							accept="video/*"
							onSelect={ onSelectVideo }
							onSelectURL={ onSelectURL }
							onError={ onUploadError }
						/>
					</BlockControls>
				</>
			) }
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<VideoCommonSettings
						setAttributes={ setAttributes }
						attributes={ attributes }
					/>
					<MediaUploadCheck>
						<div className="editor-video-poster-control">
							<BaseControl.VisualLabel>
								{ __( 'Poster image' ) }
							</BaseControl.VisualLabel>
							<MediaUpload
								title={ __( 'Select poster image' ) }
								onSelect={ onSelectPoster }
								allowedTypes={
									VIDEO_POSTER_ALLOWED_MEDIA_TYPES
								}
								render={ ( { open } ) => (
									<Button
										variant="primary"
										onClick={ open }
										ref={ posterImageButton }
										aria-describedby={
											videoPosterDescription
										}
									>
										{ ! poster
											? __( 'Select' )
											: __( 'Replace' ) }
									</Button>
								) }
							/>
							<p id={ videoPosterDescription } hidden>
								{ poster
									? sprintf(
											/* translators: %s: poster image URL. */
											__(
												'The current poster image url is %s'
											),
											poster
									  )
									: __(
											'There is no poster image currently selected'
									  ) }
							</p>
							{ !! poster && (
								<Button
									onClick={ onRemovePoster }
									variant="tertiary"
								>
									{ __( 'Remove' ) }
								</Button>
							) }
						</div>
					</MediaUploadCheck>
				</PanelBody>
			</InspectorControls>
			<figure { ...blockProps }>
				{ /*
					Disable the video tag if the block is not selected
					so the user clicking on it won't play the
					video when the controls are enabled.
				*/ }
				<Disabled isDisabled={ ! isSingleSelected }>
					<video
						controls={ controls }
						poster={ poster }
						src={ src || temporaryURL }
						ref={ videoPlayer }
					>
						<Tracks tracks={ tracks } />
					</video>
				</Disabled>
				{ !! temporaryURL && <Spinner /> }
				<Caption
					attributes={ attributes }
					setAttributes={ setAttributes }
					isSelected={ isSingleSelected }
					insertBlocksAfter={ insertBlocksAfter }
					label={ __( 'Video caption text' ) }
					showToolbarButton={ isSingleSelected }
				/>
			</figure>
		</>
	);
}

export default VideoEdit;
