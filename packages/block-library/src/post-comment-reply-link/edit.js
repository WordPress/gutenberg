/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

function PostCommentReplyLink() {
	return (
		<div { ...useBlockProps() }>
			<a href="#comments" onClick={ ( event ) => event.preventDefault() }>
				{ __( 'Reply' ) }
			</a>
		</div>
	);
}

export default PostCommentReplyLink;
