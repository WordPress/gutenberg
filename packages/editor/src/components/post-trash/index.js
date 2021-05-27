/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

function PostTrash( { isNew, postId, postType, ...props } ) {
	if ( isNew || ! postId ) {
		return null;
	}

	const onClick = () => props.trashPost( postId, postType );

	return (
		<Button
			className="editor-post-trash"
			isDestructive
			variant="tertiary"
			onClick={ onClick }
		>
			{ __( 'Move to trash' ) }
		</Button>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isEditedPostNew,
			getCurrentPostId,
			getCurrentPostType,
		} = select( 'core/editor' );
		return {
			isNew: isEditedPostNew(),
			postId: getCurrentPostId(),
			postType: getCurrentPostType(),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		trashPost: dispatch( 'core/editor' ).trashPost,
	} ) ),
] )( PostTrash );
