import clsx from 'clsx';
import { isBlobURL } from '@wordpress/blob';
import {
	Spinner,
	Placeholder,
	ToolbarButton,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	store as blockEditorStore,
	useBlockProps,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { useRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { image as imageIcon, video as icon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { createBlock } from '@wordpress/blocks';
import { prependHTTPS } from '@wordpress/url';
import { createUpgradedEmbedBlock } from '../embed/util';
import {
	useUploadMediaFromBlobURL,
	useToolsPanelDropdownMenuProps,
} from '../utils/hooks';
import VideoCommonSettings from './edit-common-settings';
import TracksEditor from './tracks-editor';
import Tracks from './tracks';
import { Caption } from '../utils/caption';
import PosterImage from '../utils/poster-image';
import { isGifVariation, isLivePhotoVariation } from './variations';
import { getCarriedMotionConversionAttributes } from '../utils/motion-companion';

const ALLOWED_MEDIA_TYPES = [ 'video' ];

function VideoEdit( {
	isSelected: isSingleSelected,
	attributes,
	className,
	clientId,
	setAttributes,
	insertBlocksAfter,
	onReplace,
} ) {
	const videoPlayer = useRef();
	const { id, controls, poster, src, tracks, width, height } = attributes;
	const isGif = isGifVariation( attributes );
	const isLivePhoto = isLivePhotoVariation( attributes );
	// Both variations play with the same attributes; only autoplay differs.
	const playsLikeMotion = isGif || isLivePhoto;
	// Give the <video> an explicit (non-`auto`) aspect ratio derived from the
	// stored dimensions. The width/height attributes alone only yield
	// `aspect-ratio: auto W/H`, whose `auto` keyword defers to the element's
	// natural ratio while the poster/metadata load - during which Chrome briefly
	// computes a runaway height (tens of thousands of pixels) before settling.
	// That spike is what reads as a duplicated image during the GIF-to-video
	// swap. A non-`auto` ratio governs the box height throughout the load.
	const aspectRatio =
		width && height ? `${ width } / ${ height }` : undefined;
	const [ temporaryURL, setTemporaryURL ] = useState( attributes.blob );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const blockEditingMode = useBlockEditingMode();
	const hasNonContentControls = blockEditingMode === 'default';

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

	// The GIF variation plays like an animated GIF in the editor (the playback
	// attributes are applied to the preview <video> below). Regular videos do
	// not autoplay in the editor, so only nudge GIFs into playing after a
	// source change in case the muted autoplay did not start on its own.
	useEffect( () => {
		if ( isGif ) {
			// Browsers allow muted videos to be played programmatically.
			videoPlayer.current?.play().catch( () => {} );
		}
	}, [ isGif, src, poster ] );

	// A Live photo rests on its still frame and plays only while the pointer
	// is over it (or it holds focus, so the motion is reachable without a
	// pointer). Rewinding on the way out returns it to that still frame.
	// These read the element from the event rather than the ref, matching the
	// front-end module, which has only the event's element to work with.
	function playLivePhoto( event ) {
		// Browsers allow muted videos to be played programmatically.
		event.currentTarget.play().catch( () => {} );
	}

	function pauseLivePhoto( event ) {
		const player = event.currentTarget;
		player.pause();
		player.currentTime = 0;
	}

	// TODO: Whether the video was obtained from the media library or was provided by URL, obtain the `videoWidth` and `videoHeight` of the video once its metadata has loaded and persist in the block attributes.
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
			const url = prependHTTPS( newSrc );
			// Check if there's an embed block that handles this URL.
			const embedBlock = createUpgradedEmbedBlock( {
				attributes: { url },
			} );
			if ( undefined !== embedBlock && onReplace ) {
				onReplace( embedBlock );
				return;
			}
			setAttributes( {
				blob: undefined,
				src: url,
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

	/*
	 * A Live photo plays a companion video of an image attachment, so this
	 * block can be turned back into the still image it was converted from.
	 * That needs the attachment record, which only resolves asynchronously —
	 * hence a dedicated control rather than a block-switcher transform, which
	 * has to decide synchronously whether it applies.
	 */
	const stillImage = useSelect(
		( select ) =>
			isLivePhoto && id && isSingleSelected
				? select( coreStore ).getEntityRecord(
						'postType',
						'attachment',
						id,
						{ context: 'view' }
				  )
				: null,
		[ isLivePhoto, id, isSingleSelected ]
	);

	const { replaceBlocks } = useDispatch( blockEditorStore );

	function convertToStillImage() {
		replaceBlocks(
			clientId,
			createBlock( 'core/image', {
				...getCarriedMotionConversionAttributes( attributes ),
				id,
				url: stillImage.source_url,
				alt: stillImage.alt_text,
				caption: attributes.caption,
				/*
				 * Without this the Image block would convert straight back to
				 * a Live photo, since its companion video is still there.
				 */
				preserveStillImage: true,
			} )
		);
	}

	// Much of this description is duplicated from MediaPlaceholder.
	const placeholder = ( content ) => {
		return (
			<Placeholder
				className="block-editor-media-placeholder"
				withIllustration={ ! isSingleSelected }
				icon={ icon }
				label={ __( 'Video' ) }
				instructions={ __(
					'Drag and drop a video, upload, or choose from your library.'
				) }
			>
				{ content }
			</Placeholder>
		);
	};

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
						{ isLivePhoto && !! stillImage && (
							<ToolbarButton
								icon={ imageIcon }
								label={ __( 'Display as still image' ) }
								onClick={ convertToStillImage }
							/>
						) }
						<MediaReplaceFlow
							mediaId={ id }
							mediaURL={ src }
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							accept="video/*"
							onSelect={ onSelectVideo }
							onSelectURL={ onSelectURL }
							onError={ onUploadError }
							onReset={ () => onSelectVideo( undefined ) }
							variant="toolbar"
						/>
					</BlockControls>
				</>
			) }
			{ ! playsLikeMotion && (
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Settings' ) }
						resetAll={ () => {
							setAttributes( {
								autoplay: false,
								controls: true,
								loop: false,
								muted: false,
								playsInline: false,
								preload: 'metadata',
								poster: undefined,
							} );
						} }
						dropdownMenuProps={ dropdownMenuProps }
					>
						<VideoCommonSettings
							setAttributes={ setAttributes }
							attributes={ attributes }
						/>
						<PosterImage
							poster={ poster }
							onChange={ ( posterImage ) =>
								setAttributes( {
									poster: posterImage?.url,
								} )
							}
						/>
					</ToolsPanel>
				</InspectorControls>
			) }
			<figure { ...blockProps }>
				<video
					controls={ controls }
					inert={ ! isSingleSelected ? 'true' : undefined }
					poster={ poster }
					src={ src || temporaryURL }
					ref={ videoPlayer }
					autoPlay={ isGif }
					loop={ playsLikeMotion }
					muted={ playsLikeMotion }
					playsInline={ playsLikeMotion }
					onPointerEnter={ isLivePhoto ? playLivePhoto : undefined }
					onPointerLeave={ isLivePhoto ? pauseLivePhoto : undefined }
					onFocus={ isLivePhoto ? playLivePhoto : undefined }
					onBlur={ isLivePhoto ? pauseLivePhoto : undefined }
					width={ width }
					height={ height }
					style={ aspectRatio ? { aspectRatio } : undefined }
				>
					<Tracks tracks={ tracks } />
				</video>
				{ !! temporaryURL && <Spinner /> }
				<Caption
					attributes={ attributes }
					setAttributes={ setAttributes }
					isSelected={ isSingleSelected }
					insertBlocksAfter={ insertBlocksAfter }
					label={ __( 'Video caption text' ) }
					showToolbarButton={
						isSingleSelected && hasNonContentControls
					}
				/>
			</figure>
		</>
	);
}

export default VideoEdit;
