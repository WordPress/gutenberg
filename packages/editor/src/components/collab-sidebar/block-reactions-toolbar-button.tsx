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
import { unlock } from '../../lock-unlock';
import { AddReactionButton } from './add-reaction-picker';
import { getBlockReactionsId, type ReactionTarget } from './block-reactions';
import {
	useBlockReactionActions,
	useCurrentPostRef,
} from './use-block-reactions';

const { NoteIconToolbarSlotFill } = unlock( blockEditorPrivateApis );

// Stands in for an anchor the block has not minted yet. The picker's target
// only feeds its reactor-name cache, so a placeholder is harmless; the real
// anchor is minted inside the toggle.
const PENDING_ANCHOR = 'pending';

export interface BlockReactionsToolbarButtonProps {
	clientId: string;
	reactionsId?: string;
	disabled?: boolean;
	onToggleReaction: ( args: { clientId: string; emoji: string } ) => void;
}

/**
 * A block toolbar button that opens the reaction picker for a block.
 *
 * @param props                  Component props.
 * @param props.clientId         The block client id.
 * @param props.reactionsId      The block's reaction anchor, if minted.
 * @param props.disabled         Whether reacting is unavailable.
 * @param props.onToggleReaction Adds or removes a reaction on the block.
 */
export function BlockReactionsToolbarButton( {
	clientId,
	reactionsId,
	disabled = false,
	onToggleReaction,
}: BlockReactionsToolbarButtonProps ) {
	const { postId } = useCurrentPostRef();
	const target: ReactionTarget = {
		kind: 'block',
		postId: postId ?? 0,
		reactionsId: reactionsId ?? PENDING_ANCHOR,
	};

	return (
		<AddReactionButton
			target={ target }
			label={ __( 'React to block' ) }
			className="editor-block-reactions-toolbar-button"
			disabled={ disabled }
			onToggleReaction={ ( emoji ) =>
				onToggleReaction( { clientId, emoji } )
			}
			renderToggle={ ( {
				isOpen,
				onToggle,
				disabled: isDisabled,
				label,
				onPrefetch,
			} ) => (
				<ToolbarButton
					icon={ reactionIcon }
					label={ label }
					aria-haspopup="dialog"
					aria-expanded={ isOpen }
					isPressed={ isOpen }
					disabled={ isDisabled }
					onClick={ onToggle }
					onMouseEnter={ onPrefetch }
					onFocus={ onPrefetch }
					showTooltip
				/>
			) }
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
				reactionsId={ reactionsId }
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
