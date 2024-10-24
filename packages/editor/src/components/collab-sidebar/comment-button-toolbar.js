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

const { __unstableCommentIconToolbarFill } = unlock( blockEditorPrivateApis );

const AddCommentToolbarButton = ( { onClick } ) => {
	return (
		<__unstableCommentIconToolbarFill>
			<ToolbarButton
				accessibleWhenDisabled
				icon={ commentIcon }
				label={ _x( 'Comment', 'View comment' ) }
				onClick={ onClick }
			/>
		</__unstableCommentIconToolbarFill>
	);
};

export default AddCommentToolbarButton;
