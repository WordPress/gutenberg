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
} from '@wordpress/components';
import {
	InspectorControls,
	BlockControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import DimensionControls from './dimension-controls';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

const placeholder = ( content ) => {
	return (
		<Placeholder
			className="block-editor-media-placeholder"
			withIllustration={ true }
		>
			{ content }
		</Placeholder>
	);
};

function getMediaSourceUrlBySizeSlug( media, slug ) {
	return (
		media?.media_details?.sizes?.[ slug ]?.source_url || media?.source_url
	);
}

function PostFeaturedImageDisplay( {
	clientId,
	attributes,
	setAttributes,
	context: { postId, postType: postTypeSlug, queryId },
} ) {
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const { isLink, height, width, scale, sizeSlug, rel, linkTarget } =
		attributes;
	const [ featuredImage, setFeaturedImage ] = useEntityProp(
		'postType',
		postTypeSlug,
		'featured_media',
		postId
	);

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
				<div { ...blockProps }>{ placeholder() }</div>
			</>
		);
	}

	const label = __( 'Add a featured image' );

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
				style={ { height, objectFit: height && scale } }
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
			<figure { ...blockProps }>{ image }</figure>
		</>
	);
}

export default function PostFeaturedImageEdit( props ) {
	const blockProps = useBlockProps();
	if ( ! props.context?.postId ) {
		return <div { ...blockProps }>{ placeholder() }</div>;
	}
	return <PostFeaturedImageDisplay { ...props } />;
}
