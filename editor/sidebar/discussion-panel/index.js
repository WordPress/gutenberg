/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { PanelBody, FormToggle } from 'components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

class DiscussionPanel extends Component {
	constructor() {
		super( ...arguments );
		this.id = this.constructor.instances++;
	}

	render() {
		const { pingStatus = 'open', commentStatus = 'open', ...props } = this.props;
		const onTogglePingback = () => props.editPost( { ping_status: pingStatus === 'open' ? 'closed' : 'open' } );
		const onToggleComments = () => props.editPost( { comment_status: commentStatus === 'open' ? 'closed' : 'open' } );

		const commentsToggleId = 'allow-comments-toggle-' + this.id;
		const pingbacksToggleId = 'allow-pingbacks-toggle-' + this.id;

		return (
			<PanelBody title={ __( 'Discussion' ) } initialOpen={ false }>
				<div className="editor-discussion-panel__row">
					<label htmlFor={ commentsToggleId }>{ __( 'Allow Comments' ) }</label>
					<FormToggle
						checked={ commentStatus === 'open' }
						onChange={ onToggleComments }
						showHint={ false }
						id={ commentsToggleId }
					/>
				</div>
				<div className="editor-discussion-panel__row">
					<label htmlFor={ pingbacksToggleId }>{ __( 'Allow Pingbacks & Trackbacks' ) }</label>
					<FormToggle
						checked={ pingStatus === 'open' }
						onChange={ onTogglePingback }
						showHint={ false }
						id={ pingbacksToggleId }
					/>
				</div>
			</PanelBody>
		);
	}
}

DiscussionPanel.instances = 1;

export default connect(
	( state ) => {
		return {
			pingStatus: getEditedPostAttribute( state, 'ping_status' ),
			commentStatus: getEditedPostAttribute( state, 'comment_status' ),
		};
	},
	{ editPost }
)( DiscussionPanel );

