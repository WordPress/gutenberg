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
import { MediaUploadButton } from '@wordpress/blocks';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { getCurrentPostType, getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

//used when labels from post tyoe were not yet loaded or when they are not present.
const DEFAULT_SET_FEATURE_IMAGE_LABEL = __( 'No image selected' );
const DEFAULT_ADD_FEATURE_IMAGE_LABEL = __( 'Add Image' );
const DEFAULT_REMOVE_FEATURE_IMAGE_LABEL = __( 'Remove Image' );
const DEFAULT_REPLACE_FEATURE_IMAGE_LABEL = __( 'Replace Image' );

function PostFeaturedImage( { featuredImageId, onUpdateImage, onRemoveImage, media, postType } ) {
	const postLabel = get( postType, 'data.labels', {} );
	return (
		<div className="editor-post-featured-image">
			{ !! featuredImageId &&
				<MediaUploadButton
					title={ postLabel.set_featured_image }
					buttonProps={ { className: 'editor-post-featured-image__preview' } }
					onSelect={ onUpdateImage }
					type="image"
				>
					{ media && !! media.data &&
						<ResponsiveWrapper
							naturalWidth={ media.data.media_details.width }
							naturalHeight={ media.data.media_details.height }
						>
							<img src={ media.data.source_url } alt={ __( 'Featured image' ) } />
						</ResponsiveWrapper>
					}
					{ media && media.isLoading && <Spinner /> }
				</MediaUploadButton>
			}
			{ !! featuredImageId && media && ! media.isLoading &&
				<MediaUploadButton
					title={ postLabel.set_featured_image }
					buttonProps={ { className: 'button' } }
					onSelect={ onUpdateImage }
					type="image"
				>
					{ postLabel.set_featured_image || DEFAULT_REPLACE_FEATURE_IMAGE_LABEL }
				</MediaUploadButton>
			}
			{ ! featuredImageId &&
				<div>
					<MediaUploadButton
						title={ postLabel.set_featured_image || DEFAULT_SET_FEATURE_IMAGE_LABEL }
						buttonProps={ { className: 'editor-post-featured-image__toggle' } }
						onSelect={ onUpdateImage }
						type="image"
					>
						{ postLabel.set_featured_image || DEFAULT_SET_FEATURE_IMAGE_LABEL }
					</MediaUploadButton>
					<MediaUploadButton
						title={ postLabel.set_featured_image || DEFAULT_ADD_FEATURE_IMAGE_LABEL }
						buttonProps={ { className: 'button' } }
						onSelect={ onUpdateImage }
						type="image"
					>
						{ postLabel.set_featured_image || DEFAULT_ADD_FEATURE_IMAGE_LABEL }
					</MediaUploadButton>
				</div>
			}
			{ !! featuredImageId &&
				<Button className="button" onClick={ onRemoveImage }>
					{ postLabel.remove_featured_image || DEFAULT_REMOVE_FEATURE_IMAGE_LABEL }
				</Button>
			}
		</div>
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
