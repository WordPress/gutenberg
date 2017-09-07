/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, PanelBody, Spinner, ResponsiveWrapper, withAPIData } from '@wordpress/components';
import { MediaUploadButton } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditedPostAttribute, isEditorSidebarPanelOpened } from '../../selectors';
import { editPost, toggleSidebarPanel } from '../../actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'featured-image';

function FeaturedImage( { featuredImageId, onUpdateImage, onRemoveImage, media, isOpened, onTogglePanel } ) {
	return (
		<PanelBody title={ __( 'Featured Image' ) } opened={ isOpened } onToggle={ onTogglePanel }>
			<div className="editor-featured-image__content">
				{ !! featuredImageId &&
					<MediaUploadButton
						buttonProps={ { className: 'button-link editor-featured-image__preview' } }
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
					<p className="editor-featured-image__howto">
						{ __( 'Click the image to edit or update' ) }
					</p>
				}
				{ ! featuredImageId &&
					<MediaUploadButton
						buttonProps={ { className: 'editor-featured-image__toggle button-link' } }
						onSelect={ onUpdateImage }
						type="image"
					>
						{ __( 'Set featured image' ) }
					</MediaUploadButton>
				}
				{ !! featuredImageId &&
					<Button className="editor-featured-image__toggle button-link" onClick={ onRemoveImage }>
						{ __( 'Remove featured image' ) }
					</Button>
				}
			</div>
		</PanelBody>
	);
}

const applyConnect = connect(
	( state ) => {
		return {
			featuredImageId: getEditedPostAttribute( state, 'featured_media' ),
			isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
		};
	},
	{
		onUpdateImage( image ) {
			return editPost( { featured_media: image.id } );
		},
		onRemoveImage() {
			return editPost( { featured_media: null } );
		},
		onTogglePanel() {
			return toggleSidebarPanel( PANEL_NAME );
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
)( FeaturedImage );
