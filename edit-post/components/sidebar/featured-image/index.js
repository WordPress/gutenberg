/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { PanelBody, withAPIData } from '@wordpress/components';
import { PostFeaturedImage, ifPostTypeSupports } from '@wordpress/editor';
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
	);
}

const applyQuery = query( ( select ) => ( {
	postTypeSlug: select( 'core/editor', 'getCurrentPostType' ),
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
	ifPostTypeSupports( 'thumbnail' ),
	applyQuery,
	applyConnect,
	applyWithAPIData,
)( FeaturedImage );
