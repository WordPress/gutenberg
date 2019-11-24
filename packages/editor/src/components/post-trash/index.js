/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

function PostTrash( { isNew, postId, postType, ...props } ) {
	const [ disabled, setDisabled ] = useState( false );

	if ( isNew || ! postId ) {
		return null;
	}
	const onClick = () => {
		if ( disabled ) {
			return false;
		}

		setDisabled( true );

		return props.trashPost( postId, postType )
			.then( () => {
				setDisabled( false );
			} );
	};

	return (
		<Button className="editor-post-trash button-link-delete" aria-disabled={ disabled } onClick={ onClick } isDefault isLarge>
			{ __( 'Move to Trash' ) }
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
