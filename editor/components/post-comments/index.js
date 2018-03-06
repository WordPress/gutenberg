/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormToggle, withInstanceId } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';

function PostComments( { commentStatus = 'open', instanceId, ...props } ) {
	const onToggleComments = () => props.editPost( { comment_status: commentStatus === 'open' ? 'closed' : 'open' } );

	const commentsToggleId = 'allow-comments-toggle-' + instanceId;

	return [
		<label key="label" htmlFor={ commentsToggleId }>{ __( 'Allow Comments' ) }</label>,
		<FormToggle
			key="toggle"
			checked={ commentStatus === 'open' }
			onChange={ onToggleComments }
			showHint={ false }
			id={ commentsToggleId }
		/>,
	];
}

export default connect(
	( state ) => {
		return {
			commentStatus: getEditedPostAttribute( state, 'comment_status' ),
		};
	},
	{
		editPost,
	}
)( withInstanceId( PostComments ) );

