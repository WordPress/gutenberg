/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { Icon, withNotices } from '@wordpress/components';
import {
	BlockControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	BlockIcon,
	useBlockProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { postFeaturedImage } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import FeaturedImageInspectorControls from './inspector-controls';
import { ALLOWED_MEDIA_TYPES } from './constants';

const placeholderChip = (
	<div className="post-featured-image_placeholder">
		<Icon icon={ postFeaturedImage } />
		<p> { __( 'Featured Image' ) }</p>
	</div>
);

function PostFeaturedImageDisplay( {
	attributes,
	setAttributes,
	context: { postId, postType },
	noticeUI,
	noticeOperations,
} ) {
	const { useAsCover, minHeight, minHeightUnit } = attributes;
	const [ featuredImage, setFeaturedImage ] = useEntityProp(
		'postType',
		postType,
		'featured_media',
		postId
	);
	const media = useSelect(
		( select ) =>
			featuredImage && select( 'core' ).getMedia( featuredImage ),
		[ featuredImage ]
	);
	const onSelectImage = ( value ) => {
		if ( value?.id ) {
			setFeaturedImage( value.id );
		}
	};
	function onUploadError( message ) {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}
	let image;
	if ( ! featuredImage ) {
		image = (
			<MediaPlaceholder
				icon={ <BlockIcon icon={ postFeaturedImage } /> }
				onSelect={ onSelectImage }
				notices={ noticeUI }
				onError={ onUploadError }
				accept="image/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				labels={ {
					title: __( 'Featured image' ),
					instructions: __(
						'Upload a media file or pick one from your media library.'
					),
				} }
			/>
		);
	} else if ( ! media ) {
		// We have a Featured image so show a Placeholder while it's loading.
		image = placeholderChip;
	} else if ( ! useAsCover ) {
		image = (
			<img
				src={ media.source_url }
				alt={ media.alt_text || __( 'Featured image' ) }
			/>
		);
	}
	const featuredImageMinHeight = minHeightUnit
		? `${ minHeight }${ minHeightUnit }`
		: minHeight;
	const blockProps = useBlockProps( {
		className: classnames( { 'is-used-as-cover': useAsCover } ),
		style: {
			backgroundImage:
				useAsCover && `url(' ${ media?.[ 'source_url' ] }' )`,
			minHeight: useAsCover && featuredImageMinHeight,
		},
	} );
	return (
		<>
			<FeaturedImageInspectorControls
				attributes={ attributes }
				postType={ postType }
				setAttributes={ setAttributes }
			/>
			<BlockControls>
				{ !! media && (
					<MediaReplaceFlow
						mediaId={ featuredImage }
						mediaURL={ media.source_url }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						accept="image/*"
						onSelect={ onSelectImage }
						onError={ onUploadError }
					/>
				) }
			</BlockControls>
			<div { ...blockProps }>{ image }</div>
		</>
	);
}

const PostFeaturedImageWithNotices = withNotices( PostFeaturedImageDisplay );

export default function PostFeaturedImageEdit( props ) {
	if ( ! props.context?.postId ) {
		return placeholderChip;
	}
	return <PostFeaturedImageWithNotices { ...props } />;
}
