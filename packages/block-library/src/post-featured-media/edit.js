/**
 * WordPress dependencies
 */
import clsx from 'clsx';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	ToggleControl,
	Placeholder,
	Spinner,
	Button,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	InspectorControls,
	BlockControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
	__experimentalUseBorderProps as useBorderProps,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video', 'audio' ];

/**
 * Derives a simple media type ('image' | 'video' | 'audio') from a media
 * object returned by the media library or the REST API.
 *
 * The REST API returns `media_type: 'image'` for images and `media_type: 'file'`
 * for both video and audio, so we also check `mime_type` to tell those apart.
 *
 * @param {Object} media
 * @return {'image'|'video'|'audio'} Resolved media type.
 */
export function getMediaType( media ) {
	if ( media.media_type === 'image' ) {
		return 'image';
	}
	const mime = media.mime_type || media.mime || '';
	if ( mime.startsWith( 'audio/' ) ) {
		return 'audio';
	}
	if ( mime.startsWith( 'video/' ) || media.media_type === 'file' ) {
		return 'video';
	}
	// Library picker sets type directly.
	if ( media.type === 'audio' ) {
		return 'audio';
	}
	if ( media.type === 'video' ) {
		return 'video';
	}
	return 'image';
}

export default function PostFeaturedMediaEdit( {
	attributes,
	setAttributes,
	context: { postId, postType: postTypeSlug, queryId },
} ) {
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const {
		isLink,
		linkTarget,
		aspectRatio,
		width,
		height,
		scale,
		sizeSlug,
		controls,
	} = attributes;

	// Featured image is a first-class post attribute.
	const [ featuredImageId, setFeaturedImageId ] = useEntityProp(
		'postType',
		postTypeSlug,
		'featured_media',
		postId
	);

	// Featured video and audio are stored in post meta.
	const [ meta, setMeta ] = useEntityProp(
		'postType',
		postTypeSlug,
		'meta',
		postId
	);
	const featuredVideoId = meta?._featured_video_id || 0;
	const featuredAudioId = meta?._featured_audio_id || 0;

	// Priority: image > video > audio.
	let activeType = null;
	if ( featuredImageId ) {
		activeType = 'image';
	} else if ( featuredVideoId ) {
		activeType = 'video';
	} else if ( featuredAudioId ) {
		activeType = 'audio';
	}

	let activeId;
	if ( activeType === 'image' ) {
		activeId = featuredImageId;
	} else if ( activeType === 'video' ) {
		activeId = featuredVideoId;
	} else {
		activeId = featuredAudioId;
	}

	const { media, postPermalink } = useSelect(
		( select ) => {
			const { getEntityRecord, getEditedEntityRecord } =
				select( coreStore );
			return {
				media:
					activeId &&
					getEntityRecord( 'postType', 'attachment', activeId, {
						context: 'view',
					} ),
				postPermalink: postId
					? getEditedEntityRecord( 'postType', postTypeSlug, postId )
							?.link
					: null,
			};
		},
		[ activeId, postTypeSlug, postId ]
	);

	const mediaUrl =
		activeType === 'image'
			? media?.media_details?.sizes?.[ sizeSlug ]?.source_url ||
			  media?.source_url
			: media?.source_url;

	const blockProps = useBlockProps( {
		style: { width, height, aspectRatio },
	} );
	const borderProps = useBorderProps( attributes );
	const blockEditingMode = useBlockEditingMode();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const { createErrorNotice } = useDispatch( noticesStore );
	const onUploadError = ( message ) =>
		createErrorNotice( message, { type: 'snackbar' } );

	function onSelectMedia( newMedia ) {
		const type = getMediaType( newMedia );
		if ( type === 'video' ) {
			setMeta( { ...meta, _featured_video_id: newMedia.id } );
		} else if ( type === 'audio' ) {
			setMeta( { ...meta, _featured_audio_id: newMedia.id } );
		} else {
			setFeaturedImageId( newMedia.id );
		}
	}

	function onResetMedia() {
		if ( activeType === 'image' ) {
			setFeaturedImageId( 0 );
		} else if ( activeType === 'video' ) {
			setMeta( { ...meta, _featured_video_id: 0 } );
		} else if ( activeType === 'audio' ) {
			setMeta( { ...meta, _featured_audio_id: 0 } );
		}
	}

	const inspector = blockEditingMode === 'default' && (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ () =>
					setAttributes( {
						isLink: false,
						linkTarget: '_self',
						controls: true,
					} )
				}
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					label={ __( 'Link to post' ) }
					isShownByDefault
					hasValue={ () => !! isLink }
					onDeselect={ () => setAttributes( { isLink: false } ) }
				>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Make media a link' ) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
				</ToolsPanelItem>
				{ isLink && (
					<ToolsPanelItem
						label={ __( 'Open in new tab' ) }
						isShownByDefault
						hasValue={ () => '_self' !== linkTarget }
						onDeselect={ () =>
							setAttributes( { linkTarget: '_self' } )
						}
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Open in new tab' ) }
							onChange={ ( value ) =>
								setAttributes( {
									linkTarget: value ? '_blank' : '_self',
								} )
							}
							checked={ linkTarget === '_blank' }
						/>
					</ToolsPanelItem>
				) }
				{ ( activeType === 'video' || activeType === 'audio' ) && (
					<ToolsPanelItem
						label={ __( 'Playback controls' ) }
						isShownByDefault
						hasValue={ () => ! controls }
						onDeselect={ () => setAttributes( { controls: true } ) }
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show playback controls' ) }
							onChange={ () =>
								setAttributes( { controls: ! controls } )
							}
							checked={ controls }
						/>
					</ToolsPanelItem>
				) }
			</ToolsPanel>
		</InspectorControls>
	);

	const placeholder = ( content ) => (
		<Placeholder
			className={ clsx(
				'block-editor-media-placeholder',
				borderProps.className
			) }
			withIllustration
			style={ {
				height: !! aspectRatio && '100%',
				width: !! aspectRatio && '100%',
				...borderProps.style,
			} }
		>
			{ content }
		</Placeholder>
	);

	// No media set, and we can't edit (query loop or no post context).
	if ( ! activeType && ( isDescendentOfQueryLoop || ! postId ) ) {
		return (
			<>
				{ inspector }
				<figure { ...blockProps }>{ placeholder() }</figure>
			</>
		);
	}

	// No media set, standalone editable context: offer upload/select for all types.
	if ( ! activeType ) {
		return (
			<>
				{ inspector }
				<figure { ...blockProps }>
					<MediaPlaceholder
						onSelect={ onSelectMedia }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						onError={ onUploadError }
						placeholder={ placeholder }
						mediaLibraryButton={ ( { open } ) => (
							<Button
								__next40pxDefaultSize
								icon={ upload }
								variant="primary"
								label={ __( 'Add featured media' ) }
								showTooltip
								tooltipPosition="top center"
								onClick={ open }
							/>
						) }
					/>
				</figure>
			</>
		);
	}

	// Media is set — render the appropriate element.
	const mediaStyles = {
		...borderProps.style,
		height: aspectRatio ? '100%' : height,
		width: !! aspectRatio && '100%',
		objectFit: !! ( height || aspectRatio ) && scale,
	};

	let mediaEl;
	if ( activeType === 'image' ) {
		mediaEl = ! media ? (
			placeholder()
		) : (
			<img
				className={ borderProps.className }
				src={ mediaUrl }
				alt={
					media.alt_text
						? sprintf(
								// translators: %s: image alt text.
								__( 'Featured media: %s' ),
								media.alt_text
						  )
						: __( 'Featured media' )
				}
				style={ mediaStyles }
			/>
		);
	} else if ( activeType === 'video' ) {
		// Reuses the same <video> element pattern as core/video.
		if ( media === undefined ) {
			mediaEl = placeholder( <Spinner /> );
		} else if ( ! media ) {
			mediaEl = placeholder();
		} else {
			mediaEl = (
				<video
					src={ mediaUrl }
					controls={ controls || undefined }
					style={ { ...mediaStyles, width: '100%' } }
				/>
			);
		}
	} else if ( media === undefined ) {
		// Reuses the same <audio> element pattern as core/audio.
		mediaEl = placeholder( <Spinner /> );
	} else if ( ! media ) {
		mediaEl = placeholder();
	} else {
		mediaEl = (
			<audio
				src={ mediaUrl }
				controls={ controls || undefined }
				style={ { width: '100%' } }
			/>
		);
	}

	const wrappedMedia = isLink ? (
		<a href={ postPermalink } target={ linkTarget }>
			{ mediaEl }
		</a>
	) : (
		mediaEl
	);

	return (
		<>
			{ inspector }
			{ !! activeId && ! isDescendentOfQueryLoop && (
				<BlockControls group="other">
					<MediaReplaceFlow
						mediaId={ activeId }
						mediaURL={ mediaUrl }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						onSelect={ onSelectMedia }
						onError={ onUploadError }
						onReset={ onResetMedia }
					/>
				</BlockControls>
			) }
			<figure { ...blockProps }>{ wrappedMedia }</figure>
		</>
	);
}
