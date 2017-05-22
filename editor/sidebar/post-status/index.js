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
import PostVisibility from '../post-visibility';
import { getEditedPostStatus, getSuggestedPostFormat } from '../../selectors';
import { editPost } from '../../actions';

function PostStatus( { status, onUpdateStatus, suggestedFormat } ) {
	const onToggle = () => {
		const updatedStatus = status === 'pending' ? 'draft' : 'pending';
		onUpdateStatus( updatedStatus );
	};

	// Use the suggested post format based on the blocks content of the post
	// or the default post format setting for the site.
	const format = suggestedFormat || __( 'Standard' );

	// Disable Reason: The input is inside the label, we shouldn't need the htmlFor
	/* eslint-disable jsx-a11y/label-has-for */
	return (
		<PanelBody title={ __( 'Status & Visibility' ) }>
			<label className="editor-post-status__row">
				<span>{ __( 'Pending review' ) }</span>
				<FormToggle
					checked={ status === 'pending' }
					onChange={ onToggle }
				/>
			</label>
			<div className="editor-post-status__row">
				<PostVisibility />
			</div>
			<div className="editor-post-status__row">
				<span>{ __( 'Post Format' ) }</span>
				<span>{ format }</span>
			</div>
		</PanelBody>
	);
	/* eslint-enable jsx-a11y/label-has-for */
}

export default connect(
	( state ) => ( {
		status: getEditedPostStatus( state ),
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

