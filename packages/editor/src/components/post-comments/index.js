/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

function PostComments( { commentStatus = 'open', ...props } ) {
	const onToggleComments = () => props.editPost( { comment_status: commentStatus === 'open' ? 'closed' : 'open' } );

	return (
		<CheckboxControl
			label={ __( 'Allow comments' ) }
			checked={ commentStatus === 'open' }
			onChange={ onToggleComments }
		/>
	);
}

export default compose( [
	withSelect( ( select ) => {
		return {
			commentStatus: select( 'core/editor' ).getEditedPostAttribute( 'comment_status' ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		editPost: dispatch( 'core/editor' ).editPost,
	} ) ),
] )( PostComments );
