/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { PostComments, PostPingbacks } from '../../components';
import { isEditorSidebarPanelOpened } from '../../state/selectors';
import { toggleSidebarPanel } from '../../state/actions';

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

