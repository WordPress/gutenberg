/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { CommentIconSlotFill } = unlock( blockEditorPrivateApis );

const AddCommentMenuItem = ( { clientId, onClick, isDistractionFree } ) => {
	const block = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlock( clientId );
		},
		[ clientId ]
	);
	const shortcut = useSelect(
		( select ) =>
			select( keyboardShortcutsStore ).getShortcutRepresentation(
				'core/editor/new-note'
			),
		[]
	);

	if (
		! block?.isValid ||
		block?.name === getUnregisteredTypeHandlerName()
	) {
		return null;
	}

	const isDisabled = isDistractionFree || block?.name === 'core/freeform';

	let infoText;

	if ( isDistractionFree ) {
		infoText = __( 'Notes are disabled in distraction free mode.' );
	} else if ( block?.name === 'core/freeform' ) {
		infoText = __( 'Convert to blocks to add notes.' );
	}

	return (
		<MenuItem
			onClick={ onClick }
			aria-haspopup="dialog"
			disabled={ isDisabled }
			info={ infoText }
			shortcut={ shortcut }
		>
			{ __( 'Add note' ) }
		</MenuItem>
	);
};

const AddCommentMenuItemFill = ( { onClick, isDistractionFree } ) => {
	return (
		<CommentIconSlotFill.Fill>
			{ ( { clientId, onClose } ) => (
				<AddCommentMenuItem
					clientId={ clientId }
					isDistractionFree={ isDistractionFree }
					onClick={ () => {
						onClick( clientId );
						onClose();
					} }
				/>
			) }
		</CommentIconSlotFill.Fill>
	);
};

export default AddCommentMenuItemFill;
