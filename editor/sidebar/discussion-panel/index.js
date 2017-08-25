/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow, FormToggle, withInstanceId } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { getEditedPostAttribute, isEditorSidebarPanelOpened } from '../../selectors';
import { editPost, toggleSidebarPanel } from '../../actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'discussion-panel';

function DiscussionPanel( { pingStatus = 'open', commentStatus = 'open', instanceId, isOpened, ...props } ) {
	const onTogglePingback = () => props.editPost( { ping_status: pingStatus === 'open' ? 'closed' : 'open' } );
	const onToggleComments = () => props.editPost( { comment_status: commentStatus === 'open' ? 'closed' : 'open' } );
	const onTogglePanel = () => props.toggleSidebarPanel( PANEL_NAME );

	const commentsToggleId = 'allow-comments-toggle-' + instanceId;
	const pingbacksToggleId = 'allow-pingbacks-toggle-' + instanceId;

	return (
		<PanelBody title={ __( 'Discussion' ) } opened={ isOpened } onToggle={ onTogglePanel }>
			<PanelRow>
				<label htmlFor={ commentsToggleId }>{ __( 'Allow Comments' ) }</label>
				<FormToggle
					checked={ commentStatus === 'open' }
					onChange={ onToggleComments }
					showHint={ false }
					id={ commentsToggleId }
				/>
			</PanelRow>
			<PanelRow>
				<label htmlFor={ pingbacksToggleId }>{ __( 'Allow Pingbacks & Trackbacks' ) }</label>
				<FormToggle
					checked={ pingStatus === 'open' }
					onChange={ onTogglePingback }
					showHint={ false }
					id={ pingbacksToggleId }
				/>
			</PanelRow>
		</PanelBody>
	);
}

export default connect(
	( state ) => {
		return {
			pingStatus: getEditedPostAttribute( state, 'ping_status' ),
			commentStatus: getEditedPostAttribute( state, 'comment_status' ),
			isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
		};
	},
	{ editPost, toggleSidebarPanel }
)( withInstanceId( DiscussionPanel ) );

