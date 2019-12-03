/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostTrashCheck from './check';

function PostTrash( { trashPost } ) {
	return (
		<PostTrashCheck>
			<Button
				onClick={ trashPost }
				isDefault
				isLarge
				className="editor-post-trash button-link-delete"
			>
				{ __( 'Move to Trash' ) }
			</Button>
		</PostTrashCheck>
	);
}

export default withDispatch( ( dispatch, ownProps, registry ) => {
	const { trashPost } = dispatch( 'core/editor' );

	return {
		trashPost() {
			const { postId } = ownProps;
			const { getCurrentPostType } = registry.select( 'core/editor' );
			const postType = getCurrentPostType();
			trashPost( postId, postType );
		},
	};
} )( PostTrash );
