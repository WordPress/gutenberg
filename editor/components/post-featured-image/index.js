/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Spinner, ResponsiveWrapper, withAPIData } from '@wordpress/components';
import { MediaUpload } from '@wordpress/blocks';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import PostFeaturedImageCheck from './check';
import { getCurrentPostType, getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';

//used when labels from post tyoe were not yet loaded or when they are not present.
const DEFAULT_SET_FEATURE_IMAGE_LABEL = __( 'Set featured image' );
const DEFAULT_REMOVE_FEATURE_IMAGE_LABEL = __( 'Remove featured image' );

function PostFeaturedImage( { featuredImageId, onUpdateImage, onRemoveImage, media, postType } ) {
	const postLabel = get( postType, 'data.labels', {} );

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
							<Button className="button-link editor-post-featured-image__preview" onClick={ open } >
								{ media && !! media.data &&
									<ResponsiveWrapper
										naturalWidth={ media.data.media_details.width }
										naturalHeight={ media.data.media_details.height }
									>
										<img src={ media.data.source_url } alt={ __( 'Featured image' ) } />
									</ResponsiveWrapper>
								}
								{ media && media.isLoading && <Spinner /> }
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
						render={ ( { open } )=>(
							<Button className="editor-post-featured-image__toggle button-link" onClick={ open }>
								{ postLabel.set_featured_image || DEFAULT_SET_FEATURE_IMAGE_LABEL }
							</Button>
						) }
					/>
				}
				{ !! featuredImageId &&
					<Button className="editor-post-featured-image__toggle button-link" onClick={ onRemoveImage }>
						{ postLabel.remove_featured_image || DEFAULT_REMOVE_FEATURE_IMAGE_LABEL }
					</Button>
				}
			</div>
		</PostFeaturedImageCheck>
	);
}

const applyConnect = connect(
	( state ) => {
		return {
			featuredImageId: getEditedPostAttribute( state, 'featured_media' ),
			postTypeName: getCurrentPostType( state ),
		};
	},
	{
		onUpdateImage( image ) {
			return editPost( { featured_media: image.id } );
		},
		onRemoveImage() {
			return editPost( { featured_media: 0 } );
		},
	}
);

const applyWithAPIData = withAPIData( ( { featuredImageId, postTypeName } ) => {
	return {
		media: featuredImageId ? `/wp/v2/media/${ featuredImageId }` : undefined,
		postType: postTypeName ? `/wp/v2/types/${ postTypeName }?context=edit` : undefined,
	};
} );

export default compose(
	applyConnect,
	applyWithAPIData,
)( PostFeaturedImage );
