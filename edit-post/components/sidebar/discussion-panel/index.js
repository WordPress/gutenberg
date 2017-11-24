/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow } from '@wordpress/components';
import { PostComments, PostPingbacks } from '@wordpress/editor';

/**
 * Internal Dependencies
 */
import { isEditorSidebarPanelOpened } from '../../../store/selectors';
import { toggleSidebarPanel } from '../../../store/actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'discussion-panel';

function DiscussionPanel( { isOpened, onTogglePanel } ) {
	return (
		<PanelBody title={ __( 'Discussion' ) } opened={ isOpened } onToggle={ onTogglePanel }>
			<PanelRow>
				<PostComments />
			</PanelRow>
			<PanelRow>
				<PostPingbacks />
			</PanelRow>
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
)( DiscussionPanel );

