/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Spinner, ResponsiveWrapper } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import PostFeaturedImageCheck from './check';
import MediaUpload from '../media-upload';

// Used when labels from post type were not yet loaded or when they are not present.
const DEFAULT_SET_FEATURE_IMAGE_LABEL = __( 'Set featured image' );
const DEFAULT_REMOVE_FEATURE_IMAGE_LABEL = __( 'Remove featured image' );

function PostFeaturedImage( { featuredImageId, onUpdateImage, onRemoveImage, media, postType } ) {
	const postLabel = get( postType, [ 'labels' ], {} );

	return (
		<PostFeaturedImageCheck>
			<div className="editor-post-featured-image">
				{ !! featuredImageId &&
					<MediaUpload
						title={ postLabel.set_featured_image }
						onSelect={ onUpdateImage }
						type="image"
						modalClass="editor-post-featured-image__media-modal"
						render={ ( { open } ) => (
							<Button className="editor-post-featured-image__preview" onClick={ open } isLink>
								{ media &&
									<ResponsiveWrapper
										naturalWidth={ media.media_details.width }
										naturalHeight={ media.media_details.height }
									>
										<img
											alt={ __( 'Replace ' + media.alt_text + ' featured image' ) }
											src={ media.source_url }
										/>
									</ResponsiveWrapper>
								}
								{ ! media && <Spinner /> }
							</Button>
						) }
					/>
				}
				{ !! featuredImageId && media && ! media.isLoading &&
					<p className="editor-post-featured-image__howto">
						{ __( 'Click the image to edit or update' ) }
					</p>
				}
				{ ! featuredImageId &&
					<MediaUpload
						title={ postLabel.set_featured_image || DEFAULT_SET_FEATURE_IMAGE_LABEL }
						onSelect={ onUpdateImage }
						type="image"
						modalClass="editor-post-featured-image__media-modal"
						render={ ( { open } ) => (
							<Button className="editor-post-featured-image__toggle" onClick={ open } isLink>
								{ postLabel.set_featured_image || DEFAULT_SET_FEATURE_IMAGE_LABEL }
							</Button>
						) }
					/>
				}
				{ !! featuredImageId &&
					<Button className="editor-post-featured-image__toggle" onClick={ onRemoveImage } isLink>
						{ postLabel.remove_featured_image || DEFAULT_REMOVE_FEATURE_IMAGE_LABEL }
					</Button>
				}
			</div>
		</PostFeaturedImageCheck>
	);
}

const applyWithSelect = withSelect( ( select ) => {
	const { getMedia, getPostType } = select( 'core' );
	const { getEditedPostAttribute } = select( 'core/editor' );
	const featuredImageId = getEditedPostAttribute( 'featured_media' );

	return {
		media: featuredImageId ? getMedia( featuredImageId ) : null,
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
)( PostFeaturedImage );
