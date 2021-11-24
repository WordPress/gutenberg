/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	ToggleControl,
	PanelBody,
	Placeholder,
	Button,
} from '@wordpress/components';
import {
	InspectorControls,
	BlockControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
import { SVG, Path } from '@wordpress/primitives';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import DimensionControls from './dimension-controls';

const placeholderIllustration = (
	<SVG
		className="components-placeholder__illustration"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 60 60"
		preserveAspectRatio="none"
	>
		<Path vectorEffect="non-scaling-stroke" d="M60 60 0 0" />
	</SVG>
);

const ALLOWED_MEDIA_TYPES = [ 'image' ];
const placeholderChip = (
	<div className="wp-block-post-featured-image__placeholder">
		{ placeholderIllustration }
	</div>
);

function PostFeaturedImageDisplay( {
	clientId,
	attributes,
	setAttributes,
	context: { postId, postType, queryId },
} ) {
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const { isLink, height, width, scale } = attributes;
	const [ featuredImage, setFeaturedImage ] = useEntityProp(
		'postType',
		postType,
		'featured_media',
		postId
	);

	const media = useSelect(
		( select ) =>
			featuredImage &&
			select( coreStore ).getMedia( featuredImage, { context: 'view' } ),
		[ featuredImage ]
	);

	const blockProps = useBlockProps( {
		style: { width, height },
	} );

	const placeholder = ( content ) => {
		return (
			<Placeholder className="block-editor-media-placeholder">
				{ placeholderIllustration }
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
		createErrorNotice( message[ 2 ], { type: 'snackbar' } );
	};

	let image;
	if ( ! featuredImage && isDescendentOfQueryLoop ) {
		return <div { ...blockProps }>{ placeholderChip }</div>;
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
			placeholderChip
		) : (
			<img
				src={ media.source_url }
				alt={ media.alt_text || __( 'Featured image' ) }
				style={ { height, objectFit: height && scale } }
			/>
		);
	}

	return (
		<>
			<DimensionControls
				clientId={ clientId }
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ sprintf(
							// translators: %s: Name of the post type e.g: "post".
							__( 'Link to %s' ),
							postType
						) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
				</PanelBody>
			</InspectorControls>
			{ !! media && ! isDescendentOfQueryLoop && (
				<BlockControls group="other">
					<MediaReplaceFlow
						mediaId={ featuredImage }
						mediaURL={ media.source_url }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						accept="image/*"
						onSelect={ onSelectImage }
						onError={ onUploadError }
					/>
				</BlockControls>
			) }
			<figure { ...blockProps }>{ image }</figure>
		</>
	);
}

export default function PostFeaturedImageEdit( props ) {
	const blockProps = useBlockProps();
	if ( ! props.context?.postId ) {
		return <div { ...blockProps }>{ placeholderChip }</div>;
	}
	return <PostFeaturedImageDisplay { ...props } />;
}
