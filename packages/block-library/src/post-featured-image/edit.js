/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	MenuItem,
	ToggleControl,
	PanelBody,
	Placeholder,
	Button,
	TextControl,
	ToolbarButton,
	ToolbarDropdownMenu,
} from '@wordpress/components';
import {
	InspectorControls,
	BlockControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
	store as blockEditorStore,
	__experimentalGetElementClassName,
	__experimentalUseBorderProps as useBorderProps,
	RichText,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { upload, caption as captionIcon, pencil } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { useEffect, useState, useCallback } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import DimensionControls from './dimension-controls';
import Overlay from './overlay';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

function getMediaSourceUrlBySizeSlug( media, slug ) {
	return (
		media?.media_details?.sizes?.[ slug ]?.source_url || media?.source_url
	);
}

function PostFeaturedImageDisplay( {
	clientId,
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
	context: { postId, postType: postTypeSlug, queryId },
} ) {
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const {
		isLink,
		height,
		width,
		scale,
		sizeSlug,
		rel,
		linkTarget,
		caption,
		displayCaption,
	} = attributes;
	const [ featuredImage, setFeaturedImage ] = useEntityProp(
		'postType',
		postTypeSlug,
		'featured_media',
		postId
	);

	const prevCaption = usePrevious( caption );
	const [ showCaption, setShowCaption ] = useState( !! caption );
	// We need to show the caption when changes come from
	// history navigation(undo/redo).
	useEffect( () => {
		if ( caption && ! prevCaption ) {
			setShowCaption( true );
		}
	}, [ caption, prevCaption ] );

	// Focus the caption when we click to add one.
	const captionRef = useCallback(
		( node ) => {
			if ( node && ! caption ) {
				node.focus();
			}
		},
		[ caption ]
	);

	useEffect( () => {
		if ( ! isSelected && ! caption ) {
			setShowCaption( false );
		}
	}, [ isSelected, caption ] );

	const { media, postType } = useSelect(
		( select ) => {
			const { getMedia, getPostType } = select( coreStore );
			return {
				media:
					featuredImage &&
					getMedia( featuredImage, {
						context: 'view',
					} ),
				postType: postTypeSlug && getPostType( postTypeSlug ),
			};
		},
		[ featuredImage, postTypeSlug ]
	);
	const mediaUrl = getMediaSourceUrlBySizeSlug( media, sizeSlug );

	const mediaLibraryCaption = !! media?.caption?.rendered
		? media?.caption?.rendered
		: '';

	const captionControls = [
		{
			role: 'menuitemradio',
			title: __( 'Media Library caption' ),
			isActive: displayCaption === true,
			icon: captionIcon,
			label: !! displayCaption
				? __( 'Hide Media Library caption' )
				: __( 'Show Media library caption' ),
			onClick: () => {
				setAttributes( {
					displayCaption: !! displayCaption ? false : true,
					caption: undefined,
				} );
				if ( showCaption === true ) {
					setShowCaption( ! showCaption );
				}
			},
		},
		{
			role: 'menuitemradio',
			title: __( 'Custom caption' ),
			isActive: showCaption === true,
			icon: pencil,
			label: !! displayCaption
				? __( 'Remove caption' )
				: __( 'Add caption' ),
			onClick: () => {
				setAttributes( {
					displayCaption: false,
				} );
				setShowCaption( ! showCaption );
				if ( showCaption && caption ) {
					setAttributes( { caption: undefined } );
				}
			},
		},
	];

	const imageSizes = useSelect(
		( select ) => select( blockEditorStore ).getSettings().imageSizes,
		[]
	);
	const imageSizeOptions = imageSizes
		.filter( ( { slug } ) => {
			return media?.media_details?.sizes?.[ slug ]?.source_url;
		} )
		.map( ( { name, slug } ) => ( {
			value: slug,
			label: name,
		} ) );

	const blockProps = useBlockProps( {
		style: { width, height },
	} );
	const borderProps = useBorderProps( attributes );

	const placeholder = ( content ) => {
		return (
			<Placeholder
				className={ classnames(
					'block-editor-media-placeholder',
					borderProps.className
				) }
				withIllustration={ true }
				style={ borderProps.style }
			>
				{ content }
			</Placeholder>
		);
	};

	const onSelectImage = ( value ) => {
		if ( value?.id ) {
			setFeaturedImage( value.id );
		}
	};

	const { createErrorNotice } = useDispatch( noticesStore );
	const onUploadError = ( message ) => {
		createErrorNotice( message, { type: 'snackbar' } );
	};

	const controls = (
		<>
			<BlockControls group="block">
				{ mediaLibraryCaption && ! isDescendentOfQueryLoop && (
					<ToolbarDropdownMenu
						icon={ captionIcon }
						label={ __( 'Caption' ) }
						controls={ captionControls }
					/>
				) }
				{ ! mediaLibraryCaption && ! isDescendentOfQueryLoop && (
					<ToolbarButton
						onClick={ () => {
							setShowCaption( ! showCaption );
							if ( showCaption && caption ) {
								setAttributes( { caption: undefined } );
							}
						} }
						icon={ captionIcon }
						isPressed={ showCaption }
						label={
							showCaption
								? __( 'Remove caption' )
								: __( 'Add caption' )
						}
					/>
				) }
				{ mediaLibraryCaption && isDescendentOfQueryLoop && (
					<ToolbarButton
						onClick={ () => {
							setAttributes( {
								displayCaption: !! displayCaption
									? false
									: true,
								caption: undefined,
							} );
						} }
						icon={ captionIcon }
						isPressed={ displayCaption }
						label={
							!! displayCaption
								? __( 'Hide Media Library caption' )
								: __( 'Show Media Library caption' )
						}
					/>
				) }
			</BlockControls>
			<DimensionControls
				clientId={ clientId }
				attributes={ attributes }
				setAttributes={ setAttributes }
				imageSizeOptions={ imageSizeOptions }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={
							postType?.labels.singular_name
								? sprintf(
										// translators: %s: Name of the post type e.g: "post".
										__( 'Link to %s' ),
										postType.labels.singular_name.toLowerCase()
								  )
								: __( 'Link to post' )
						}
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
					{ isLink && (
						<>
							<ToggleControl
								label={ __( 'Open in new tab' ) }
								onChange={ ( value ) =>
									setAttributes( {
										linkTarget: value ? '_blank' : '_self',
									} )
								}
								checked={ linkTarget === '_blank' }
							/>
							<TextControl
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
	if ( ! featuredImage && isDescendentOfQueryLoop ) {
		return (
			<>
				{ controls }
				<div { ...blockProps }>
					{ placeholder() }
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
		height,
		objectFit: height && scale,
	};

	if ( ! featuredImage ) {
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
		image = ! media ? (
			placeholder()
		) : (
			<img
				className={ borderProps.className }
				src={ mediaUrl }
				alt={
					media.alt_text
						? sprintf(
								// translators: %s: The image's alt text.
								__( 'Featured image: %s' ),
								media.alt_text
						  )
						: __( 'Featured image' )
				}
				style={ imageStyles }
			/>
		);
	}

	return (
		<>
			{ controls }
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
				{ image }
				<Overlay
					attributes={ attributes }
					setAttributes={ setAttributes }
					clientId={ clientId }
				/>
				{ showCaption &&
					! displayCaption &&
					( ! RichText.isEmpty( caption ) || isSelected ) && (
						<RichText
							tagName="figcaption"
							className={ __experimentalGetElementClassName(
								'caption'
							) }
							aria-label={ __( 'Image caption text' ) }
							ref={ captionRef }
							placeholder={ __( 'Add caption' ) }
							value={ caption }
							onChange={ ( value ) =>
								setAttributes( { caption: value } )
							}
							inlineToolbar
							__unstableOnSplitAtEnd={ () =>
								insertBlocksAfter(
									createBlock( getDefaultBlockName() )
								)
							}
						/>
					) }
				{ displayCaption && (
					<figcaption
						className={ __experimentalGetElementClassName(
							'caption'
						) }
						dangerouslySetInnerHTML={ {
							__html: mediaLibraryCaption,
						} }
					/>
				) }
			</figure>
		</>
	);
}

export default function PostFeaturedImageEdit( props ) {
	const blockProps = useBlockProps();
	const borderProps = useBorderProps( props.attributes );

	if ( ! props.context?.postId ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					className={ classnames(
						'block-editor-media-placeholder',
						borderProps.className
					) }
					withIllustration={ true }
					style={ borderProps.style }
				/>
				<Overlay
					attributes={ props.attributes }
					setAttributes={ props.setAttributes }
					clientId={ props.clientId }
				/>
			</div>
		);
	}
	return <PostFeaturedImageDisplay { ...props } />;
}
