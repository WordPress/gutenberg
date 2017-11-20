/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Spinner, ResponsiveWrapper, withAPIData } from '@wordpress/components';
import { MediaUploadButton } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditedPostAttribute } from '../../state/selectors';
import { editPost } from '../../state/actions';

function PostFeaturedImage( { featuredImageId, onUpdateImage, onRemoveImage, media } ) {
	return (
		<div className="editor-post-featured-image">
			{ !! featuredImageId &&
				<MediaUploadButton
					buttonProps={ { className: 'button-link editor-post-featured-image__preview' } }
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
				<p className="editor-post-featured-image__howto">
					{ __( 'Click the image to edit or update' ) }
				</p>
			}
			{ ! featuredImageId &&
				<MediaUploadButton
					buttonProps={ { className: 'editor-post-featured-image__toggle button-link' } }
					onSelect={ onUpdateImage }
					type="image"
				>
					{ __( 'Set featured image' ) }
				</MediaUploadButton>
			}
			{ !! featuredImageId &&
				<Button className="editor-post-featured-image__toggle button-link" onClick={ onRemoveImage }>
					{ __( 'Remove featured image' ) }
				</Button>
			}
		</div>
	);
}

const applyConnect = connect(
	( state ) => {
		return {
			featuredImageId: getEditedPostAttribute( state, 'featured_media' ),
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

const applyWithAPIData = withAPIData( ( { featuredImageId } ) => {
	if ( ! featuredImageId ) {
		return {};
	}

	return {
		media: `/wp/v2/media/${ featuredImageId }`,
	};
} );

export default flowRight(
	applyConnect,
	applyWithAPIData,
)( PostFeaturedImage );
