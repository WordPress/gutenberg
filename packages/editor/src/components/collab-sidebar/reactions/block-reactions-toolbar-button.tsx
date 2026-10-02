import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { reaction as reactionIcon } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import { unlock } from '../../../lock-unlock';
import { getBlockReactionsId } from './block-reactions';

const { NoteIconToolbarSlotFill } = unlock( blockEditorPrivateApis );

/**
 * The selected block's "React to block" toolbar button, filled into the
 * note toolbar slot beside the note avatar indicator. It opens the block's
 * reactions in the sidebar, where the picker lives.
 *
 * @param props          Component props.
 * @param props.clientId The selected block's client id.
 * @param props.onClick  Brings the block's reactions into view.
 */
export function BlockReactionsToolbarButton( {
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
		<NoteIconToolbarSlotFill.Fill>
			<ToolbarButton
				icon={ reactionIcon }
				label={ __( 'React to block' ) }
				disabled={ isDisabled }
				accessibleWhenDisabled
				onClick={ onClick }
			/>
		</NoteIconToolbarSlotFill.Fill>
	);
}
