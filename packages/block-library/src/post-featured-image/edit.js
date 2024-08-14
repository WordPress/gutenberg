/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	MenuItem,
	ToggleControl,
	PanelBody,
	Placeholder,
	Button,
	Spinner,
	TextControl,
} from '@wordpress/components';
import {
	InspectorControls,
	BlockControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalGetShadowClassesAndStyles as getShadowClassesAndStyles,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { useMemo, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import DimensionControls from './dimension-controls';
import OverlayControls from './overlay-controls';
import Overlay from './overlay';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

function getMediaSourceUrlBySizeSlug( media, slug ) {
	return (
		media?.media_details?.sizes?.[ slug ]?.source_url || media?.source_url
	);
}

const disabledClickProps = {
	onClick: ( event ) => event.preventDefault(),
	'aria-disabled': true,
};

export default function PostFeaturedImageEdit( {
	clientId,
	attributes,
	setAttributes,
	context: { postId, postType: postTypeSlug, queryId },
} ) {
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const {
		isLink,
		aspectRatio,
		height,
		width,
		scale,
		sizeSlug,
		rel,
		linkTarget,
		useFirstImageFromPost,
	} = attributes;
	const [ temporaryURL, setTemporaryURL ] = useState();

	const [ storedFeaturedImage, setFeaturedImage ] = useEntityProp(
		'postType',
		postTypeSlug,
		'featured_media',
		postId
	);

	// Fallback to post content if no featured image is set.
	// This is needed for the "Use first image from post" option.
	const [ postContent ] = useEntityProp(
		'postType',
		postTypeSlug,
		'content',
		postId
	);

	const featuredImage = useMemo( () => {
		if ( storedFeaturedImage ) {
			return storedFeaturedImage;
		}

		if ( ! useFirstImageFromPost ) {
			return;
		}

		const imageOpener =
			/<!--\s+wp:(?:core\/)?image\s+(?<attrs>{(?:(?:[^}]+|}+(?=})|(?!}\s+\/?-->).)*)?}\s+)?-->/.exec(
				postContent
			);
		const imageId =
			imageOpener?.groups?.attrs &&
			JSON.parse( imageOpener.groups.attrs )?.id;
		return imageId;
	}, [ storedFeaturedImage, useFirstImageFromPost, postContent ] );

	const { media, postType, postPermalink } = useSelect(
		( select ) => {
			const { getMedia, getPostType, getEditedEntityRecord } =
				select( coreStore );
			return {
				media:
					featuredImage &&
					getMedia( featuredImage, {
						context: 'view',
					} ),
				postType: postTypeSlug && getPostType( postTypeSlug ),
				postPermalink: getEditedEntityRecord(
					'postType',
					postTypeSlug,
					postId
				)?.link,
			};
		},
		[ featuredImage, postTypeSlug, postId ]
	);

	const mediaUrl = getMediaSourceUrlBySizeSlug( media, sizeSlug );

	const blockProps = useBlockProps( {
		style: { width, height, aspectRatio },
		className: clsx( {
			'is-transient': temporaryURL,
		} ),
	} );
	const borderProps = useBorderProps( attributes );
	const shadowProps = getShadowClassesAndStyles( attributes );
	const blockEditingMode = useBlockEditingMode();

	const placeholder = ( content ) => {
		return (
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
	};

	const onSelectImage = ( value ) => {
		if ( value?.id ) {
			setFeaturedImage( value.id );
		}

		if ( value?.url && isBlobURL( value.url ) ) {
			setTemporaryURL( value.url );
		}
	};

	// Reset temporary url when media is available.
	useEffect( () => {
		if ( mediaUrl && temporaryURL ) {
			setTemporaryURL();
		}
	}, [ mediaUrl, temporaryURL ] );

	const { createErrorNotice } = useDispatch( noticesStore );
	const onUploadError = ( message ) => {
		createErrorNotice( message, { type: 'snackbar' } );
		setTemporaryURL();
	};

	const controls = blockEditingMode === 'default' && (
		<>
			<InspectorControls group="color">
				<OverlayControls
					attributes={ attributes }
					setAttributes={ setAttributes }
					clientId={ clientId }
				/>
			</InspectorControls>
			<InspectorControls group="dimensions">
				<DimensionControls
					clientId={ clientId }
					attributes={ attributes }
					setAttributes={ setAttributes }
					media={ media }
				/>
			</InspectorControls>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={
							postType?.labels.singular_name
								? sprintf(
										// translators: %s: Name of the post type e.g: "Page".
										__( 'Link to %s' ),
										postType.labels.singular_name
								  )
								: __( 'Link to post' )
						}
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
					{ isLink && (
						<>
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
							<TextControl
								// TODO: Switch to `true` (40px size) if possible
								__next40pxDefaultSize={ false }
								__nextHasNoMarginBottom
								label={ __( 'Link rel' ) }
								value={ rel }
								onChange={ ( newRel ) =>
									setAttributes( { rel: newRel } )
								}
							/>
						</>
					) }
				</PanelBody>
			</InspectorControls>
		</>
	);

	let image;

	/**
	 * A Post Featured Image block should not have image replacement
	 * or upload options in the following cases:
	 * - Is placed in a Query Loop. This is a conscious decision to
	 * prevent content editing of different posts in Query Loop, and
	 * this could change in the future.
	 * - Is in a context where it does not have a postId (for example
	 * in a template or template part).
	 */
	if ( ! featuredImage && ( isDescendentOfQueryLoop || ! postId ) ) {
		return (
			<>
				{ controls }
				<div { ...blockProps }>
					{ !! isLink ? (
						<a
							href={ postPermalink }
							target={ linkTarget }
							{ ...disabledClickProps }
						>
							{ placeholder() }
						</a>
					) : (
						placeholder()
					) }
					<Overlay
						attributes={ attributes }
						setAttributes={ setAttributes }
						clientId={ clientId }
					/>
				</div>
			</>
		);
	}

	const label = __( 'Add a featured image' );
	const imageStyles = {
		...borderProps.style,
		...shadowProps.style,
		height: aspectRatio ? '100%' : height,
		width: !! aspectRatio && '100%',
		objectFit: !! ( height || aspectRatio ) && scale,
	};

	/**
	 * When the post featured image block is placed in a context where:
	 * - It has a postId (for example in a single post)
	 * - It is not inside a query loop
	 * - It has no image assigned yet
	 * Then display the placeholder with the image upload option.
	 */
	if ( ! featuredImage && ! temporaryURL ) {
		image = (
			<MediaPlaceholder
				onSelect={ onSelectImage }
				accept="image/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				onError={ onUploadError }
				placeholder={ placeholder }
				mediaLibraryButton={ ( { open } ) => {
					return (
						<Button
							icon={ upload }
							variant="primary"
							label={ label }
							showTooltip
							tooltipPosition="top center"
							onClick={ () => {
								open();
							} }
						/>
					);
				} }
			/>
		);
	} else {
		// We have a Featured image so show a Placeholder if is loading.
		image =
			! media && ! temporaryURL ? (
				placeholder()
			) : (
				<>
					<img
						className={ borderProps.className }
						src={ temporaryURL || mediaUrl }
						alt={
							media && media?.alt_text
								? sprintf(
										// translators: %s: The image's alt text.
										__( 'Featured image: %s' ),
										media.alt_text
								  )
								: __( 'Featured image' )
						}
						style={ imageStyles }
					/>
					{ temporaryURL && <Spinner /> }
				</>
			);
	}

	/**
	 * When the post featured image block:
	 * - Has an image assigned
	 * - Is not inside a query loop
	 * Then display the image and the image replacement option.
	 */
	return (
		<>
			{ ! temporaryURL && controls }
			{ !! media && ! isDescendentOfQueryLoop && (
				<BlockControls group="other">
					<MediaReplaceFlow
						mediaId={ featuredImage }
						mediaURL={ mediaUrl }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						accept="image/*"
						onSelect={ onSelectImage }
						onError={ onUploadError }
					>
						<MenuItem onClick={ () => setFeaturedImage( 0 ) }>
							{ __( 'Reset' ) }
						</MenuItem>
					</MediaReplaceFlow>
				</BlockControls>
			) }
			<figure { ...blockProps }>
				{ /* If the featured image is linked, wrap in an <a /> tag to trigger any inherited link element styles */ }
				{ !! isLink ? (
					<a
						href={ postPermalink }
						target={ linkTarget }
						{ ...disabledClickProps }
					>
						{ image }
					</a>
				) : (
					image
				) }
				<Overlay
					attributes={ attributes }
					setAttributes={ setAttributes }
					clientId={ clientId }
				/>
			</figure>
		</>
	);
}
