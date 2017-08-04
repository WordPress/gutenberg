/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Button, Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	isEditedPostNew,
	getCurrentPostId,
	getCurrentPostType,
} from '../../selectors';
import { trashPost } from '../../actions';

function PostTrash( { isNew, postId, postType, ...props } ) {
	if ( isNew || ! postId ) {
		return null;
	}

	const onClick = () => props.trashPost( postId, postType );

	return (
		<PanelRow>
			<Button className="editor-post-trash button-link button-link-delete" onClick={ onClick }>
				{ __( 'Move to trash' ) }
				<Dashicon icon="trash" />
			</Button>
		</PanelRow>
	);
}

export default connect(
	( state ) => {
		return {
			isNew: isEditedPostNew( state ),
			postId: getCurrentPostId( state ),
			postType: getCurrentPostType( state ),
		};
	},
	{ trashPost }
)( PostTrash );
