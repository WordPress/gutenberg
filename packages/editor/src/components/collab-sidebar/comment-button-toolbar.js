/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { comment as commentIcon } from '@wordpress/icons';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { CommentIconToolbarSlotFill } = unlock( blockEditorPrivateApis );

const AddCommentToolbarButton = ( { onClick } ) => {
	return (
		<CommentIconToolbarSlotFill.Fill>
			<ToolbarButton
				accessibleWhenDisabled
				icon={ commentIcon }
				label={ _x( 'Comment', 'View comment' ) }
				onClick={ onClick }
			/>
		</CommentIconToolbarSlotFill.Fill>
	);
};

export default AddCommentToolbarButton;
