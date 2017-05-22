/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import Button from 'components/button';
import Dashicon from 'components/dashicon';

/**
 * Internal dependencies
 */
import './style.scss';
import { getCurrentPost } from '../../selectors';
import { trashPost } from '../../actions';

function PostTrash( { postId, ...props } ) {
	if ( ! postId ) {
		return null;
	}

	const onClick = () => props.trashPost( postId );

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
			postId: getCurrentPost( state ).id,
		};
	},
	( dispatch ) => {
		return {
			trashPost( postId ) {
				return trashPost( dispatch, postId );
			},
		};
	}
)( PostTrash );
