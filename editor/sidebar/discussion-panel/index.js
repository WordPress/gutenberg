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
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

function DiscussionPanel( { pingStatus = 'open', commentStatus = 'open', instanceId, ...props } ) {
	const onTogglePingback = () => props.editPost( { ping_status: pingStatus === 'open' ? 'closed' : 'open' } );
	const onToggleComments = () => props.editPost( { comment_status: commentStatus === 'open' ? 'closed' : 'open' } );

	const commentsToggleId = 'allow-comments-toggle-' + instanceId;
	const pingbacksToggleId = 'allow-pingbacks-toggle-' + instanceId;

	return (
		<PanelBody title={ __( 'Discussion' ) } initialOpen={ false }>
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
		};
	},
	{ editPost }
)( withInstanceId( DiscussionPanel ) );

