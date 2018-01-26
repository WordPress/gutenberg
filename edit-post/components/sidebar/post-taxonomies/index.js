/**
 * External Dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { PostTaxonomies as PostTaxonomiesForm, PostTaxonomiesCheck } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { isEditorSidebarPanelOpened } from '../../../store/selectors';
import { toggleSidebarPanel } from '../../../store/actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-taxonomies';

function PostTaxonomies( { isOpened, onTogglePanel } ) {
	return (
		<PostTaxonomiesCheck>
			<PanelBody
				title={ __( 'Categories & Tags' ) }
				opened={ isOpened }
				onToggle={ onTogglePanel }
			>
				<PostTaxonomiesForm />
			</PanelBody>
		</PostTaxonomiesCheck>
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
	},
	undefined,
	{ storeKey: 'edit-post' }
)( PostTaxonomies );

