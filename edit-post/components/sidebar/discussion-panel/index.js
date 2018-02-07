/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow } from '@wordpress/components';
import { PostComments, PostPingbacks, ifPostTypeSupports } from '@wordpress/editor';

/**
 * Internal Dependencies
 */
import { isEditorSidebarPanelOpened } from '../../../store/selectors';
import { toggleSidebarPanel } from '../../../store/actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'discussion-panel';

const PostCommentsRow = ifPostTypeSupports( 'comments' )( () => (
	<PanelRow>
		<PostComments />
	</PanelRow>
) );

const PostPingbacksRow = ifPostTypeSupports( 'trackbacks' )( () => (
	<PanelRow>
		<PostPingbacks />
	</PanelRow>
) );

function DiscussionPanel( { isOpened, onTogglePanel } ) {
	return (
		<PanelBody
			title={ __( 'Discussion' ) }
			opened={ isOpened }
			onToggle={ onTogglePanel }
		>
			<PostCommentsRow />
			<PostPingbacksRow />
		</PanelBody>
	);
}

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

export default compose( [
	ifPostTypeSupports( [ 'comments', 'trackbacks' ] ),
	applyConnect,
] )( DiscussionPanel );
