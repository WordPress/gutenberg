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
	TextControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { Link } from '@wordpress/ui';
import { createInterpolateElement, useMemo } from '@wordpress/element';
import {
	InspectorControls,
	BlockControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalGetShadowClassesAndStyles as getShadowClassesAndStyles,
	useBlockEditingMode,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import DimensionControls from './dimension-controls';
import OverlayControls from './overlay-controls';
import Overlay from './overlay';
import { unlock } from '../lock-unlock';

const { ResolutionTool } = unlock( blockEditorPrivateApis );

const ALLOWED_MEDIA_TYPES = [ 'image', 'video', 'audio' ];

/**
 * Derives a simple media type ('image' | 'video' | 'audio') from a media object.
 *
 * The REST API returns `media_type: 'image'` for images and `media_type: 'file'`
 * for both video and audio, so we also check `mime_type` to tell those apart.
 * The media library picker uses `media.type` and `media.mime` instead.
 *
 * Keep this implementation in sync with the copy in
 * `packages/editor/src/components/post-featured-image/unified-featured-media.js` —
 * cross-package extraction is a separate refactor.
 *
 * @param {Object} media Attachment object from REST or the media library.
 * @return {'image'|'video'|'audio'|null} Resolved media type, or null for nullish input.
 */
export function getMediaType( media ) {
	if ( ! media ) {
		return null;
	}
	if ( media.media_type === 'image' || media.type === 'image' ) {
		return 'image';
	}
	const mime = media.mime_type || media.mime || '';
	if ( mime.startsWith( 'audio/' ) ) {
		return 'audio';
	}
	if ( mime.startsWith( 'video/' ) || media.media_type === 'file' ) {
		return 'video';
	}
	if ( media.type === 'audio' ) {
		return 'audio';
	}
	if ( media.type === 'video' ) {
		return 'video';
	}
	return 'image';
}

export default function PostFeaturedMediaEdit( {
	clientId,
	attributes,
	setAttributes,
	context: { postId, postType: postTypeSlug, queryId },
} ) {
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const {
		isLink,
		linkTarget,
		rel,
		aspectRatio,
		width,
		height,
		scale,
		sizeSlug,
		controls,
		useFirstImageFromPost,
	} = attributes;

	const [ storedFeaturedImageId, setFeaturedImageId ] = useEntityProp(
		'postType',
		postTypeSlug,
		'featured_media',
		postId
	);

	const [ meta, setMeta ] = useEntityProp(
		'postType',
		postTypeSlug,
		'meta',
		postId
	);
	const featuredMediaId = meta?._featured_media_id || 0;
	const featuredMediaType = meta?._featured_media_type || '';

	const [ postContent ] = useEntityProp(
		'postType',
		postTypeSlug,
		'content',
		postId
	);
	const featuredImageId = useMemo( () => {
		if ( storedFeaturedImageId ) {
			return storedFeaturedImageId;
		}
		if ( ! useFirstImageFromPost ) {
			return 0;
		}
		const imageOpener =
			/<!--\s+wp:(?:core\/)?image\s+(?<attrs>{(?:(?:[^}]+|}+(?=})|(?!}\s+\/?-->).)*)?}\s+)?-->/.exec(
				postContent
			);
		const imageId =
			imageOpener?.groups?.attrs &&
			JSON.parse( imageOpener.groups.attrs )?.id;
		return imageId || 0;
	}, [ storedFeaturedImageId, useFirstImageFromPost, postContent ] );

	let activeType = null;
	let activeId = 0;
	if ( featuredImageId ) {
		activeType = 'image';
		activeId = featuredImageId;
	} else if ( featuredMediaId && featuredMediaType ) {
		activeType = featuredMediaType;
		activeId = featuredMediaId;
	}

	const { media, postPermalink, imageSizes } = useSelect(
		( select ) => {
			const { getEntityRecord, getEditedEntityRecord } =
				select( coreStore );
			const { getSettings } = select( blockEditorStore );
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
				imageSizes: getSettings().imageSizes,
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
	const shadowProps = getShadowClassesAndStyles( attributes );
	const blockEditingMode = useBlockEditingMode();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const imageSizeOptions = ( imageSizes || [] )
		.filter(
			( { slug } ) => media?.media_details?.sizes?.[ slug ]?.source_url
		)
		.map( ( { name, slug } ) => ( { value: slug, label: name } ) );

	const { createErrorNotice } = useDispatch( noticesStore );
	const onUploadError = ( message ) =>
		createErrorNotice( message, { type: 'snackbar' } );

	function onSelectMedia( newMedia ) {
		const type = getMediaType( newMedia );
		if ( type === 'image' ) {
			setFeaturedImageId( newMedia.id );
			setMeta( {
				...meta,
				_featured_media_id: 0,
				_featured_media_type: '',
			} );
		} else {
			setFeaturedImageId( 0 );
			setMeta( {
				...meta,
				_featured_media_id: newMedia.id,
				_featured_media_type: type,
			} );
		}
	}

	function onResetMedia() {
		setFeaturedImageId( 0 );
		setMeta( {
			...meta,
			_featured_media_id: 0,
			_featured_media_type: '',
		} );
	}

	const colorControls = blockEditingMode === 'default' && (
		<InspectorControls group="color">
			<OverlayControls
				attributes={ attributes }
				setAttributes={ setAttributes }
				clientId={ clientId }
			/>
		</InspectorControls>
	);

	const dimensionControls = blockEditingMode === 'default' && (
		<InspectorControls group="dimensions">
			<DimensionControls
				clientId={ clientId }
				attributes={ attributes }
				setAttributes={ setAttributes }
				media={ activeType === 'image' ? media : null }
			/>
			{ activeType === 'image' && imageSizeOptions.length > 0 && (
				<ResolutionTool
					value={ sizeSlug }
					onChange={ ( nextSizeSlug ) =>
						setAttributes( { sizeSlug: nextSizeSlug } )
					}
					options={ imageSizeOptions }
				/>
			) }
		</InspectorControls>
	);

	const inspector = blockEditingMode === 'default' && (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ () =>
					setAttributes( {
						isLink: false,
						linkTarget: '_self',
						rel: '',
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
				{ isLink && (
					<ToolsPanelItem
						label={ __( 'Link relation' ) }
						isShownByDefault
						hasValue={ () => !! rel }
						onDeselect={ () => setAttributes( { rel: '' } ) }
					>
						<TextControl
							__next40pxDefaultSize
							label={ __( 'Link relation' ) }
							help={ createInterpolateElement(
								__(
									'The <a>Link Relation</a> attribute defines the relationship between a linked resource and the current document.'
								),
								{
									a: (
										<Link
											href="https://developer.mozilla.org/docs/Web/HTML/Attributes/rel"
											openInNewTab
										/>
									),
								}
							) }
							value={ rel }
							onChange={ ( newRel ) =>
								setAttributes( { rel: newRel } )
							}
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
				...shadowProps.style,
			} }
		>
			{ content }
		</Placeholder>
	);

	// No media set, and we can't edit (query loop or no post context).
	if ( ! activeType && ( isDescendentOfQueryLoop || ! postId ) ) {
		return (
			<>
				{ colorControls }
				{ dimensionControls }
				{ inspector }
				<figure { ...blockProps }>
					{ placeholder() }
					<Overlay
						attributes={ attributes }
						setAttributes={ setAttributes }
						clientId={ clientId }
					/>
				</figure>
			</>
		);
	}

	// No media set, standalone editable context: offer upload/select for all types.
	if ( ! activeType ) {
		return (
			<>
				{ colorControls }
				{ dimensionControls }
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
		...shadowProps.style,
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
		if ( media === undefined ) {
			mediaEl = placeholder( <Spinner /> );
		} else if ( ! media ) {
			mediaEl = placeholder();
		} else {
			mediaEl = (
				<video
					src={ mediaUrl }
					controls={ controls || undefined }
					preload="metadata"
					playsInline
					style={ { ...mediaStyles, width: '100%' } }
				/>
			);
		}
	} else if ( media === undefined ) {
		mediaEl = placeholder( <Spinner /> );
	} else if ( ! media ) {
		mediaEl = placeholder();
	} else {
		mediaEl = (
			<audio
				src={ mediaUrl }
				controls={ controls || undefined }
				preload="metadata"
				style={ { width: '100%' } }
			/>
		);
	}

	const wrappedMedia = isLink ? (
		<a
			href={ postPermalink }
			target={ linkTarget }
			rel={ rel || undefined }
		>
			{ mediaEl }
		</a>
	) : (
		mediaEl
	);

	return (
		<>
			{ colorControls }
			{ dimensionControls }
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
			<figure { ...blockProps }>
				{ wrappedMedia }
				<Overlay
					attributes={ attributes }
					setAttributes={ setAttributes }
					clientId={ clientId }
				/>
			</figure>
		</>
	);
}
