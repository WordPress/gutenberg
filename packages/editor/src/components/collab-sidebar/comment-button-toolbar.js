/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { comment as commentIcon } from '@wordpress/icons';
import { __unstableCommentIconToolbarFill as CommentIconToolbarFill } from '@wordpress/block-editor';

const AddCommentToolbarButton = ( { onClick } ) => {
	return (
		<CommentIconToolbarFill>
			<ToolbarButton
				accessibleWhenDisabled
				icon={ commentIcon }
				label={ _x( 'Comment', 'Open comment button' ) }
				onClick={ onClick }
			/>
		</CommentIconToolbarFill>
	);
};

export default AddCommentToolbarButton;
