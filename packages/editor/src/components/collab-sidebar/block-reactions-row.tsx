import { __, sprintf } from '@wordpress/i18n';
import { ThemeProvider } from '@wordpress/theme';
import {
	BlockIcon,
	privateApis as blockEditorPrivateApis,
	useBlockDisplayInformation,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';
import ReactionDisplay from './reaction-display';
import { AddReactionButton } from './add-reaction-picker';
import { useCurrentPostRef } from './use-block-reactions';
import type { ReactionSummary, ReactionTarget } from './block-reactions';

const { useBlockDisplayTitle } = unlock( blockEditorPrivateApis );

/**
 * Accessible name for a block's reactions, e.g. "Reactions on Paragraph".
 *
 * @param clientId The block client id.
 * @return The label.
 */
export function useBlockReactionsLabel( clientId: string ): string {
	const title: string | null = useBlockDisplayTitle( {
		clientId,
		maximumLength: 35,
		context: 'list-view',
	} );
	return sprintf(
		// translators: %s: block title
		__( 'Reactions on %s' ),
		title ?? __( 'block' )
	);
}

export interface BlockReactionsRowProps {
	clientId: string;
	reactionsId: string;
	reactions: ReactionSummary;
	onToggleBlockReaction: ( args: {
		clientId: string;
		emoji: string;
	} ) => void;
	onRemoveLast?: () => void;
}

/**
 * A block's reaction pills and add-reaction trigger, as one row in the
 * sidebar. Rendered only once the block has at least one reaction, so the
 * trigger never needs to float.
 *
 * @param props                       Component props.
 * @param props.clientId              The block client id.
 * @param props.reactionsId           The block's reaction anchor.
 * @param props.reactions             The block's reaction summary.
 * @param props.onToggleBlockReaction Adds or removes a reaction on the block.
 * @param props.onRemoveLast          Where to send focus when the last pill
 *                                    is removed and this row unmounts.
 */
export function BlockReactionsRow( {
	clientId,
	reactionsId,
	reactions,
	onToggleBlockReaction,
	onRemoveLast,
}: BlockReactionsRowProps ) {
	const { postId } = useCurrentPostRef();
	const label = useBlockReactionsLabel( clientId );
	const blockInformation = useBlockDisplayInformation( clientId );
	const target: ReactionTarget = {
		kind: 'block',
		postId: postId ?? 0,
		reactionsId,
	};
	const toggle = ( emoji: string ) =>
		onToggleBlockReaction( { clientId, emoji } );

	return (
		// The editor sets `cornerRadius="none"`, but reactions read as
		// badges rather than controls, so the row opts into the pill shape
		// the Design System's `pronounced` preset gives a small Button.
		<ThemeProvider cornerRadius="pronounced">
			<div
				role="group"
				aria-label={ label }
				className="editor-collab-sidebar-panel__block-reactions"
			>
				<BlockIcon
					icon={ blockInformation?.icon }
					className="editor-collab-sidebar-panel__block-reactions-icon"
				/>
				<ReactionDisplay
					target={ target }
					reactions={ reactions }
					onToggleReaction={ toggle }
					onRemoveLast={ onRemoveLast }
				>
					<AddReactionButton
						target={ target }
						label={ __( 'Add block reaction' ) }
						onToggleReaction={ toggle }
					/>
				</ReactionDisplay>
			</div>
		</ThemeProvider>
	);
}
