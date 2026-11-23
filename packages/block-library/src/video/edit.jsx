import clsx from 'clsx';
import { isBlobURL } from '@wordpress/blob';
import {
	Spinner as WCSpinner,
	Placeholder,
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
	__experimentalGetDimensionsClassesAndStyles as getDimensionsClassesAndStyles,
	__experimentalGetShadowClassesAndStyles as getShadowClassesAndStyles,
} from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { useReducedMotion, useRefEffect } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { inertValue } from '@wordpress/react-inert-value';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { video as icon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
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
import VideoOriginalControl from './video-original-control';
import { companionUrl } from './companion-url';

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
	const {
		id,
		controls,
		poster,
		src,
		tracks,
		width,
		height,
		autoplay,
		loop,
		muted,
		playsInline,
	} = attributes;
	// Give the <video> an explicit (non-`auto`) aspect ratio derived from the
	// stored dimensions. The width/height attributes alone only yield
	// `aspect-ratio: auto W/H`, whose `auto` keyword defers to the element's
	// natural ratio while the poster/metadata load - during which Chrome briefly
	// computes a runaway height (tens of thousands of pixels) before settling.
	// That spike is what reads as a duplicated image during the GIF-to-video
	// swap. A non-`auto` ratio governs the box height throughout the load.
	const aspectRatio =
		width && height ? `${ width } / ${ height }` : undefined;
	const videoStyle = {
		...( aspectRatio && { aspectRatio } ),
		...getDimensionsClassesAndStyles( attributes ).style,
		...getShadowClassesAndStyles( attributes ).style,
	};
	const [ temporaryURL, setTemporaryURL ] = useState( attributes.blob );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const blockEditingMode = useBlockEditingMode();
	const hasNonContentControls = blockEditingMode === 'default';
	const prefersReducedMotion = useReducedMotion();

	useUploadMediaFromBlobURL( {
		url: temporaryURL,
		allowedTypes: ALLOWED_MEDIA_TYPES,
		onChange: onSelectVideo,
		onError: onUploadError,
	} );

	// `autoPlay` only applies when the video loads, so reload it when reduced
	// motion changes.
	const videoRef = useRefEffect(
		( node ) => {
			node.load();
		},
		[ poster, prefersReducedMotion ]
	);

	const registry = useRegistry();

	/*
	 * A Media Library pick carries no `media_details`, so swap to the web-safe
	 * companion once the attachment record is known, unless the block has
	 * moved on to another video by then.
	 */
	function swapToCompanionWhenKnown( attachmentId ) {
		registry
			.resolveSelect( coreStore )
			.getEntityRecord( 'postType', 'attachment', attachmentId, {
				context: 'view',
			} )
			.then( ( record ) => {
				const companion = record?.media_details?.optimized_video;
				const currentId = registry
					.select( blockEditorStore )
					.getBlockAttributes( clientId )?.id;
				if (
					companion &&
					record.source_url &&
					currentId === attachmentId
				) {
					setAttributes( {
						src: companionUrl( record.source_url, companion ),
					} );
				}
			} )
			.catch( () => {} );
	}

	// TODO: Whether the video was obtained from the media library or was provided by URL, obtain the `videoWidth` and `videoHeight` of the video once its metadata has loaded and persist in the block attributes.
	function onSelectVideo( media ) {
		if ( ! media || ! media.url ) {
			// The upload failed. Only clear the temporary blob URL, so a failed
			// replacement leaves the current video, poster and caption intact.
			setAttributes( { blob: undefined } );
			setTemporaryURL();
			return;
		}

		if ( isBlobURL( media.url ) ) {
			setTemporaryURL( media.url );
			return;
		}

		/*
		 * Prefer the web-safe transcoded companion when available: the
		 * original video stays the attachment (media.id) but the block plays
		 * the optimized version. `media_details.optimized_video` is only set
		 * on transcoded video attachments, so its presence is a sufficient
		 * signal to swap the playback source. The author can switch back to
		 * the original from the toolbar (see VideoOriginalControl).
		 *
		 * An upload arrives as a REST record with `media_details`; a Media
		 * Library pick does not, so the swap waits for the attachment record.
		 */
		let nextSrc = media.url;
		if ( media.media_details?.optimized_video ) {
			nextSrc = companionUrl(
				media.url,
				media.media_details.optimized_video
			);
		} else if ( media.id && ! media.media_details ) {
			swapToCompanionWhenKnown( media.id );
		}

		// Sets the block's attribute and updates the edit component from the
		// selected media.
		setAttributes( {
			blob: undefined,
			src: nextSrc,
			id: media.id,
			poster:
				media.image?.src !== media.icon ? media.image?.src : undefined,
			caption: media.caption,
		} );
		setTemporaryURL();
	}

	function onResetVideo() {
		setAttributes( {
			src: undefined,
			id: undefined,
			poster: undefined,
			caption: undefined,
			blob: undefined,
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
						<MediaReplaceFlow
							mediaId={ id }
							mediaURL={ src }
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							accept="video/*"
							onSelect={ onSelectVideo }
							onSelectURL={ onSelectURL }
							onError={ onUploadError }
							onReset={ onResetVideo }
							variant="toolbar"
						/>
					</BlockControls>
					<VideoOriginalControl
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
				</>
			) }
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
			<figure { ...blockProps }>
				<video
					controls={ controls }
					inert={ inertValue( ! isSingleSelected ) }
					poster={ poster }
					src={ src || temporaryURL }
					ref={ videoRef }
					autoPlay={ autoplay && ! prefersReducedMotion }
					loop={ loop }
					muted={ muted }
					playsInline={ playsInline }
					width={ width }
					height={ height }
					style={
						Object.keys( videoStyle ).length
							? videoStyle
							: undefined
					}
				>
					<Tracks tracks={ tracks } />
				</video>
				{ !! temporaryURL && <WCSpinner /> }
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
