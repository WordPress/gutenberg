/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { PostFeaturedImage } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { isEditorSidebarPanelOpened } from '../../../store/selectors';
import { toggleSidebarPanel } from '../../../store/actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'featured-image';

function FeaturedImage( { isOpened, onTogglePanel } ) {
	return (
		<PanelBody title={ __( 'Featured Image' ) } opened={ isOpened } onToggle={ onTogglePanel }>
			<PostFeaturedImage />
		</PanelBody>
	);
}

export default connect(
	( state ) => {
		return {
			isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
		};
	},
	{
		onTogglePanel() {
			return toggleSidebarPanel( PANEL_NAME );
		},
	}
)( FeaturedImage );
