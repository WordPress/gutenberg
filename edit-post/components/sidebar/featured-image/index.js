/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, withAPIData } from '@wordpress/components';
import { PostFeaturedImage, PostFeaturedImageCheck } from '@wordpress/editor';
import { compose } from '@wordpress/element';
import { query } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isEditorSidebarPanelOpened } from '../../../store/selectors';
import { toggleSidebarPanel } from '../../../store/actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'featured-image';

function FeaturedImage( { isOpened, postType, onTogglePanel } ) {
	return (
		<PostFeaturedImageCheck>
			<PanelBody
				title={ get(
					postType,
					[ 'data', 'labels', 'featured_image' ],
					__( 'Featured Image' )
				) }
				opened={ isOpened }
				onToggle={ onTogglePanel }
			>
				<PostFeaturedImage />
			</PanelBody>
		</PostFeaturedImageCheck>
	);
}

const applyQuery = query( ( select ) => ( {
	postTypeSlug: select( 'core/editor' ).getEditedPostAttribute( 'type' ),
} ) );

const applyConnect = connect(
	( state ) => {
		return {
			isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
		};
	},
	{
		onTogglePanel() {
			return toggleSidebarPanel( PANEL_NAME );
		},
	},
	undefined,
	{ storeKey: 'edit-post' }
);

const applyWithAPIData = withAPIData( ( props ) => {
	const { postTypeSlug } = props;
	return {
		postType: `/wp/v2/types/${ postTypeSlug }?context=edit`,
	};
} );

export default compose(
	applyQuery,
	applyConnect,
	applyWithAPIData,
)( FeaturedImage );
