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
import PostVisibility from '../post-visibility';
import PostTrash from '../post-trash';
import PostSchedule from '../post-schedule';
import { getEditedPostAttribute, getSuggestedPostFormat, getCurrentPost } from '../../selectors';
import { editPost } from '../../actions';

class PostStatus extends Component {
	constructor() {
		super( ...arguments );
		this.id = this.constructor.instances++;
	}

	render() {
		const { status, onUpdateStatus, suggestedFormat, post } = this.props;
		const onToggle = () => {
			let updatedStatus;
			if ( status !== 'pending' ) {
				updatedStatus = 'pending';
			} else {
				updatedStatus = post.status && post.status !== 'pending' ? post.status : 'publish';
			}
			onUpdateStatus( updatedStatus );
		};

		// Use the suggested post format based on the blocks content of the post
		// or the default post format setting for the site.
		const format = suggestedFormat || __( 'Standard' );
		const pendingId = 'pending-toggle-' + this.id;

		return (
			<PanelBody title={ __( 'Status & Visibility' ) }>
				<div className="editor-post-status__row">
					<label htmlFor={ pendingId }>{ __( 'Pending review' ) }</label>
					<FormToggle
						id={ pendingId }
						checked={ status === 'pending' }
						onChange={ onToggle }
						showHint={ false }
					/>
				</div>
				<div className="editor-post-status__row">
					<PostVisibility />
				</div>
				<div className="editor-post-status__row">
					<PostSchedule />
				</div>
				<div className="editor-post-status__row">
					<span>{ __( 'Post Format' ) }</span>
					<span>{ format }</span>
				</div>
				<div className="editor-post-status__row">
					<PostTrash />
				</div>
			</PanelBody>
		);
	}
}

PostStatus.instances = 1;

export default connect(
	( state ) => ( {
		status: getEditedPostAttribute( state, 'status' ),
		post: getCurrentPost( state ),
		suggestedFormat: getSuggestedPostFormat( state ),
	} ),
	( dispatch ) => {
		return {
			onUpdateStatus( status ) {
				dispatch( editPost( { status } ) );
			},
		};
	}
)( PostStatus );

