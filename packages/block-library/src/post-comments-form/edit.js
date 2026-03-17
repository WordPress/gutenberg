/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CommentsForm from './form';

export default function PostCommentsFormEdit( { context } ) {
	const { postId, postType } = context;

	const instanceId = useInstanceId( PostCommentsFormEdit );
	const instanceIdDesc = sprintf( 'comments-form-edit-%d-desc', instanceId );

	const blockProps = useBlockProps( {
		'aria-describedby': instanceIdDesc,
	} );

	return (
		<div { ...blockProps }>
			<CommentsForm postId={ postId } postType={ postType } />
			<VisuallyHidden id={ instanceIdDesc }>
				{ __( 'Comments form disabled in editor.' ) }
			</VisuallyHidden>
		</div>
	);
}
