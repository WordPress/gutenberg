import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import { unlock } from '../../../lock-unlock';
import { getBlockReactionsId } from './block-reactions';

const { NoteIconSlotFill } = unlock( blockEditorPrivateApis );

function BlockReactionsMenuItemControl( {
	clientId,
	onClick,
}: {
	clientId: string;
	onClick: () => void;
} ) {
	const { isAvailable, isDisabled } = useSelect(
		( select ) => {
			const { getBlock, canEditBlock } = select( blockEditorStore );
			const block = getBlock( clientId );
			return {
				isAvailable:
					!! block?.isValid &&
					block.name !== getUnregisteredTypeHandlerName(),
				// A classic block has no block-level anchor to write, and a
				// locked block cannot take a new one.
				isDisabled:
					block?.name === 'core/freeform' ||
					( ! getBlockReactionsId( block?.attributes?.metadata ) &&
						! canEditBlock( clientId ) ),
			};
		},
		[ clientId ]
	);

	if ( ! isAvailable ) {
		return null;
	}

	return (
		<MenuItem onClick={ onClick } disabled={ isDisabled }>
			{ __( 'Add reaction' ) }
		</MenuItem>
	);
}

/**
 * The "Add reaction" item in the block options menu, filled into the note
 * slot after "Add note". It opens the block's reactions in the sidebar,
 * where the picker lives.
 *
 * @param props         Component props.
 * @param props.onClick Brings the block's reactions into view.
 */
export function BlockReactionsMenuItem( {
	onClick,
}: {
	onClick: ( clientId: string ) => void;
} ) {
	return (
		<NoteIconSlotFill.Fill>
			{ ( {
				clientId,
				onClose,
			}: {
				clientId: string;
				onClose: () => void;
			} ) => (
				<BlockReactionsMenuItemControl
					clientId={ clientId }
					onClick={ () => {
						onClick( clientId );
						onClose();
					} }
				/>
			) }
		</NoteIconSlotFill.Fill>
	);
}
