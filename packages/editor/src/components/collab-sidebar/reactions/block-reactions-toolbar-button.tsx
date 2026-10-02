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
import { getBlockReactionsId } from './block-reactions';
import { useBlockReactionActions } from './use-block-reactions';

const { NoteIconToolbarSlotFill } = unlock( blockEditorPrivateApis );

export interface BlockReactionsToolbarButtonProps {
	clientId: string;
	disabled?: boolean;
	onToggleReaction: ( args: { clientId: string; emoji: string } ) => void;
}

/**
 * A block toolbar button that opens the reaction picker for a block.
 *
 * @param props                  Component props.
 * @param props.clientId         The block client id.
 * @param props.disabled         Whether reacting is unavailable.
 * @param props.onToggleReaction Adds or removes a reaction on the block.
 */
export function BlockReactionsToolbarButton( {
	clientId,
	disabled = false,
	onToggleReaction,
}: BlockReactionsToolbarButtonProps ) {
	return (
		<AddReactionButton
			label={ __( 'React to block' ) }
			trigger={
				<ToolbarButton
					icon={ reactionIcon }
					label={ __( 'React to block' ) }
					showTooltip
				/>
			}
			disabled={ disabled }
			onToggleReaction={ ( emoji ) =>
				onToggleReaction( { clientId, emoji } )
			}
		/>
	);
}

/**
 * The toolbar button for the selected block, filled into the note toolbar
 * slot beside the note avatar indicator.
 *
 * @param props           Component props.
 * @param props.clientId  The selected block's client id.
 * @param props.onReacted Called once a reaction has been added or removed,
 *                        so the host can bring the sidebar into view.
 */
export function SelectedBlockReactionsToolbarButton( {
	clientId,
	onReacted,
}: {
	clientId: string;
	onReacted?: () => void;
} ) {
	const { isAvailable, isClassic, reactionsId, canEdit } = useSelect(
		( select ) => {
			const { getBlock, canEditBlock } = select( blockEditorStore );
			const block = getBlock( clientId );
			return {
				isAvailable:
					!! block?.isValid &&
					block.name !== getUnregisteredTypeHandlerName(),
				isClassic: block?.name === 'core/freeform',
				reactionsId: getBlockReactionsId( block?.attributes?.metadata ),
				canEdit: canEditBlock( clientId ),
			};
		},
		[ clientId ]
	);
	const { onToggleBlockReaction } = useBlockReactionActions();

	if ( ! isAvailable ) {
		return null;
	}

	return (
		<NoteIconToolbarSlotFill.Fill>
			<BlockReactionsToolbarButton
				clientId={ clientId }
				// A classic block has no block-level anchor to write, and a
				// locked block cannot take a new one.
				disabled={ isClassic || ( ! reactionsId && ! canEdit ) }
				onToggleReaction={ async ( args ) => {
					if ( await onToggleBlockReaction( args ) ) {
						onReacted?.();
					}
				} }
			/>
		</NoteIconToolbarSlotFill.Fill>
	);
}
