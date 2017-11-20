/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	isCurrentPostNew,
	getCurrentPostId,
	getCurrentPostType,
} from '../../state/selectors';
import { trashPost } from '../../state/actions';

function PostTrash( { isNew, postId, postType, ...props } ) {
	if ( isNew || ! postId ) {
		return null;
	}

	const onClick = () => props.trashPost( postId, postType );

	return (
		<Button className="editor-post-trash button-link button-link-delete" onClick={ onClick }>
			{ __( 'Move to trash' ) }
			<Dashicon icon="trash" />
		</Button>
	);
}

export default connect(
	( state ) => {
		return {
			isNew: isCurrentPostNew( state ),
			postId: getCurrentPostId( state ),
			postType: getCurrentPostType( state ),
		};
	},
	{ trashPost }
)( PostTrash );
