/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import PanelBody from 'components/panel/body';
import FormToggle from 'components/form-toggle';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

function DiscussionPanel( { pingStatus = 'open', commentStatus = 'open', ...props } ) {
	const onTogglePingback = () => props.editPost( { ping_status: pingStatus === 'open' ? 'closed' : 'open' } );
	const onToggleComments = () => props.editPost( { comment_status: commentStatus === 'open' ? 'closed' : 'open' } );

	// Disable Reason: The input is inside the label, we shouldn't need the htmlFor
	/* eslint-disable jsx-a11y/label-has-for */
	return (
		<PanelBody title={ __( 'Discussion' ) } initialOpen={ false }>
			<label className="editor-discussion-panel__row">
				<span>{ __( 'Allow Comments' ) }</span>
				<FormToggle
					checked={ commentStatus === 'open' }
					onChange={ onToggleComments }
				/>
			</label>
			<label className="editor-discussion-panel__row">
				<span>{ __( 'Allow Pingbacks & Trackbacks' ) }</span>
				<FormToggle
					checked={ pingStatus === 'open' }
					onChange={ onTogglePingback }
				/>
			</label>
		</PanelBody>
	);
	/* eslint-enable jsx-a11y/label-has-for */
}

export default connect(
	( state ) => {
		return {
			pingStatus: getEditedPostAttribute( state, 'ping_status' ),
			commentStatus: getEditedPostAttribute( state, 'comment_status' ),
		};
	},
	{ editPost }
)( DiscussionPanel );

