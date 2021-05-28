/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	Icon,
	ToggleControl,
	PanelBody,
	withNotices,
} from '@wordpress/components';
import {
	InspectorControls,
	BlockControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	BlockIcon,
	useBlockProps,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { postFeaturedImage } from '@wordpress/icons';

const ALLOWED_MEDIA_TYPES = [ 'image' ];
const placeholderChip = (
	<div className="post-featured-image_placeholder">
		<Icon icon={ postFeaturedImage } />
		<p> { __( 'Featured Image' ) }</p>
	</div>
);

function PostFeaturedImageDisplay( {
	attributes: { isLink },
	setAttributes,
	context: { postId, postType },
	noticeUI,
	noticeOperations,
} ) {
	const [ featuredImage, setFeaturedImage ] = useEntityProp(
		'postType',
		postType,
		'featured_media',
		postId
	);
	const media = useSelect(
		( select ) =>
			featuredImage && select( coreStore ).getMedia( featuredImage ),
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
	} else {
		// We have a Featured image so show a Placeholder if is loading.
		image = ! media ? (
			placeholderChip
		) : (
			<img
				src={ media.source_url }
				alt={ media.alt_text || __( 'Featured image' ) }
			/>
		);
	}

	return (
		<>
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
			<BlockControls group="other">
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
			<figure { ...useBlockProps() }>{ image }</figure>
		</>
	);
}

const PostFeaturedImageWithNotices = withNotices( PostFeaturedImageDisplay );

export default function PostFeaturedImageEdit( props ) {
	const blockProps = useBlockProps();
	if ( ! props.context?.postId ) {
		return <div { ...blockProps }>{ placeholderChip }</div>;
	}
	return <PostFeaturedImageWithNotices { ...props } />;
}
