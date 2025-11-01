/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { comment as commentIcon } from '@wordpress/icons';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { CommentIconSlotFill } = unlock( blockEditorPrivateApis );

const AddCommentMenuItem = ( { clientId, onClick } ) => {
	const isFreeformBlock = useSelect(
		( select ) => {
			return (
				select( blockEditorStore ).getBlockName( clientId ) ===
				'core/freeform'
			);
		},
		[ clientId ]
	);

	return (
		<MenuItem
			icon={ commentIcon }
			onClick={ onClick }
			aria-haspopup="dialog"
			disabled={ isFreeformBlock }
			info={
				isFreeformBlock
					? __( 'Convert to blocks to add notes.' )
					: undefined
			}
		>
			{ __( 'Add note' ) }
		</MenuItem>
	);
};

const AddCommentMenuItemFill = ( { onClick } ) => {
	return (
		<CommentIconSlotFill.Fill>
			{ ( { clientId, onClose } ) => (
				<AddCommentMenuItem
					clientId={ clientId }
					onClick={ () => {
						onClick();
						onClose();
					} }
				/>
			) }
		</CommentIconSlotFill.Fill>
	);
};

export default AddCommentMenuItemFill;
