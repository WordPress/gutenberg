/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { isEditedPostNew, getCurrentPostId } from '../../store/selectors';

function PostTrashCheck( { isNew, postId, children } ) {
	if ( isNew || ! postId ) {
		return null;
	}

	return children;
}

export default connect(
	( state ) => {
		return {
			isNew: isEditedPostNew( state ),
			postId: getCurrentPostId( state ),
		};
	},
)( PostTrashCheck );
