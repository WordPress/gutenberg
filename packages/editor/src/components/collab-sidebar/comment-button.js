/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { comment as commentIcon } from '@wordpress/icons';
import { __unstableCommentIconFill as CommentIconFill } from '@wordpress/block-editor';

const AddCommentButton = ( { onClick } ) => {
	return (
		<CommentIconFill>
			<MenuItem
				icon={ commentIcon }
				onClick={ onClick }
				aria-haspopup="dialog"
			>
				{ _x( 'Comment', 'Add comment button' ) }
			</MenuItem>
		</CommentIconFill>
	);
};

export default AddCommentButton;
