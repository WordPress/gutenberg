/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Button, Dashicon } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { getCurrentPostId, getCurrentPostType } from '../../selectors';
import { trashPost } from '../../actions';

function PostTrash( { postId, postType, ...props } ) {
	if ( ! postId ) {
		return null;
	}

	const onClick = () => props.trashPost( postId, postType );

	return (
		<Button className="editor-post-trash" onClick={ onClick }>
			{ __( 'Move to trash' ) }
			<Dashicon icon="trash" />
		</Button>
	);
}

export default connect(
	( state ) => {
		return {
			postId: getCurrentPostId( state ),
			postType: getCurrentPostType( state ),
		};
	},
	{ trashPost }
)( PostTrash );
