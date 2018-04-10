/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';

function PostComments( { commentStatus = 'open', ...props } ) {
	const onToggleComments = () => props.editPost( { comment_status: commentStatus === 'open' ? 'closed' : 'open' } );

	return (
		<ToggleControl
			label={ __( 'Allow Comments' ) }
			checked={ commentStatus === 'open' }
			onChange={ onToggleComments }
			showHint={ false }
		/>
	);
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
)( PostComments );

