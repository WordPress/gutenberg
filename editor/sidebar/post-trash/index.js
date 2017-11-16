/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { PostTrash as PostTrashLink } from '../../components';
import { isEditedPostNew, getCurrentPostId } from '../../state/selectors';

function PostTrash( { isNew, postId } ) {
	if ( isNew || ! postId ) {
		return null;
	}

	return (
		<PanelRow>
			<PostTrashLink />
		</PanelRow>
	);
}

export default connect(
	( state ) => {
		return {
			isNew: isEditedPostNew( state ),
			postId: getCurrentPostId( state ),
		};
	},
)( PostTrash );
