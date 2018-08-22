/**
 * External dependencies
 */
import { has, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { Button, Spinner, ResponsiveWrapper, withFilters } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PostFeaturedImageCheck from './check';
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';

// Used when labels from post type were not yet loaded or when they are not present.
const DEFAULT_SET_FEATURE_IMAGE_LABEL = __( 'Set featured image' );
const DEFAULT_REMOVE_FEATURE_IMAGE_LABEL = __( 'Remove image' );

const PostFeaturedImageContainer = ( { mediaUploadCheckFallback, children } ) => (
	<PostFeaturedImageCheck>
		<MediaUploadCheck
			fallback={ mediaUploadCheckFallback }
		>
			<div className="editor-post-featured-image">
				{ children }
			</div>
		</MediaUploadCheck>
	</PostFeaturedImageCheck>
);

function PostFeaturedImage( { currentPostId, featuredImageId, onUpdateImage, onRemoveImage, media, postType } ) {
	const postLabel = get( postType, [ 'labels' ], {} );

	if ( ! featuredImageId ) {
		const fallback = (
			<p>{ __( 'To edit the featured image, you need permission to upload media.' ) }</p>
		);

		return (
			<PostFeaturedImageContainer
				mediaUploadCheckFallback={ fallback }
			>
				<MediaUpload
					title={ postLabel.set_featured_image || DEFAULT_SET_FEATURE_IMAGE_LABEL }
					onSelect={ onUpdateImage }
					type="image"
					modalClass="editor-post-featured-image__media-modal"
					render={ ( { open } ) => (
						<Button className="editor-post-featured-image__toggle" onClick={ open }>
							{ __( 'Set featured image' ) }
						</Button>
					) }
				/>
			</PostFeaturedImageContainer>
		);
	}

	let mediaWidth, mediaHeight, mediaSourceUrl;
	if ( media ) {
		const mediaSize = applyFilters( 'editor.PostFeaturedImage.imageSize', 'post-thumbnail', media.id, currentPostId );
		if ( has( media, [ 'media_details', 'sizes', mediaSize ] ) ) {
			mediaWidth = media.media_details.sizes[ mediaSize ].width;
			mediaHeight = media.media_details.sizes[ mediaSize ].height;
			mediaSourceUrl = media.media_details.sizes[ mediaSize ].source_url;
		} else {
			mediaWidth = media.media_details.width;
			mediaHeight = media.media_details.height;
			mediaSourceUrl = media.source_url;
		}
	}

	const imagePreview = (
		<Fragment>
			{ media &&
				<ResponsiveWrapper
					naturalWidth={ mediaWidth }
					naturalHeight={ mediaHeight }
				>
					<img src={ mediaSourceUrl } alt={ __( 'Featured image' ) } />
				</ResponsiveWrapper>
			}
			{ ! media && <Spinner /> }
		</Fragment>
	);

	return (
		<PostFeaturedImageContainer
			mediaUploadCheckFallback={ imagePreview }
		>
			<MediaUpload
				title={ __( 'Set featured image' ) }
				onSelect={ onUpdateImage }
				type="image"
				modalClass="editor-post-featured-image__media-modal"
				render={ ( { open } ) => (
					<Button className="editor-post-featured-image__preview" onClick={ open }>
						{ imagePreview }
					</Button>
				) }
			/>
			{ media && ! media.isLoading &&
				<MediaUpload
					title={ postLabel.set_featured_image || DEFAULT_SET_FEATURE_IMAGE_LABEL }
					onSelect={ onUpdateImage }
					type="image"
					modalClass="editor-post-featured-image__media-modal"
					render={ ( { open } ) => (
						<Button onClick={ open } isDefault isLarge>
							{ __( 'Replace image' ) }
						</Button>
					) }
				/>
			}
			<MediaUploadCheck>
				<Button onClick={ onRemoveImage } isLink isDestructive>
					{ postLabel.remove_featured_image || DEFAULT_REMOVE_FEATURE_IMAGE_LABEL }
				</Button>
			</MediaUploadCheck>
		</PostFeaturedImageContainer>
	);
}

const applyWithSelect = withSelect( ( select ) => {
	const { getMedia, getPostType } = select( 'core' );
	const { getCurrentPostId, getEditedPostAttribute } = select( 'core/editor' );
	const featuredImageId = getEditedPostAttribute( 'featured_media' );

	return {
		media: featuredImageId ? getMedia( featuredImageId ) : null,
		currentPostId: getCurrentPostId(),
		postType: getPostType( getEditedPostAttribute( 'type' ) ),
		featuredImageId,
	};
} );

const applyWithDispatch = withDispatch( ( dispatch ) => {
	const { editPost } = dispatch( 'core/editor' );
	return {
		onUpdateImage( image ) {
			editPost( { featured_media: image.id } );
		},
		onRemoveImage() {
			editPost( { featured_media: 0 } );
		},
	};
} );

export default compose(
	applyWithSelect,
	applyWithDispatch,
	withFilters( 'editor.PostFeaturedImage' ),
)( PostFeaturedImage );
