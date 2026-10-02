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
import { AddReactionButton } from './add-reaction-button';
import { useBlockReaction } from './use-block-reaction';

const { NoteIconToolbarSlotFill } = unlock( blockEditorPrivateApis );

/**
 * The selected block's "React to block" toolbar button, filled into the
 * note toolbar slot beside the note avatar indicator.
 *
 * @param props           Component props.
 * @param props.clientId  The selected block's client id.
 * @param props.onReacted Called once a reaction has been added or removed,
 *                        so the host can bring the sidebar into view.
 */
export function BlockReactionsToolbarButton( {
	clientId,
	onReacted,
}: {
	clientId: string;
	onReacted: () => void;
} ) {
	const { isAvailable, isClassic, canEdit } = useSelect(
		( select ) => {
			const { getBlock, canEditBlock } = select( blockEditorStore );
			const block = getBlock( clientId );
			return {
				isAvailable:
					!! block?.isValid &&
					block.name !== getUnregisteredTypeHandlerName(),
				isClassic: block?.name === 'core/freeform',
				canEdit: canEditBlock( clientId ),
			};
		},
		[ clientId ]
	);
	const { reactionsId, toggleReaction } = useBlockReaction( clientId );

	if ( ! isAvailable ) {
		return null;
	}

	return (
		<NoteIconToolbarSlotFill.Fill>
			<AddReactionButton
				label={ __( 'React to block' ) }
				trigger={
					<ToolbarButton
						icon={ reactionIcon }
						label={ __( 'React to block' ) }
						showTooltip
					/>
				}
				// A classic block has no block-level anchor to write, and a
				// locked block cannot take a new one.
				disabled={ isClassic || ( ! reactionsId && ! canEdit ) }
				onToggleReaction={ async ( slug ) => {
					if ( await toggleReaction( slug ) ) {
						onReacted();
					}
				} }
			/>
		</NoteIconToolbarSlotFill.Fill>
	);
}
