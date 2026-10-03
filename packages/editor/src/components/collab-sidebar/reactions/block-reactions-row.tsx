import { __, sprintf } from '@wordpress/i18n';
import { ThemeProvider } from '@wordpress/theme';
import {
	BlockIcon,
	privateApis as blockEditorPrivateApis,
	useBlockDisplayInformation,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import { unlock } from '../../../lock-unlock';
import ReactionDisplay from './reaction-display';
import { AddReactionButton } from './add-reaction-button';
import { useBlockReaction } from './use-block-reaction';

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

/**
 * A block's reaction pills and add-reaction trigger, as one row in the
 * sidebar. Shown once the block has a reaction, or while the user is
 * reacting to it from the toolbar, so the trigger never needs to float.
 *
 * @param props              Component props.
 * @param props.clientId     The block client id.
 * @param props.onRemoveLast Where to send focus when the last pill is
 *                           removed and this row unmounts.
 */
export function BlockReactionsRow( {
	clientId,
	onRemoveLast,
}: {
	clientId: string;
	onRemoveLast?: () => void;
} ) {
	const { postId, reactionsId, reactions, toggleReaction } =
		useBlockReaction( clientId );
	const label = useBlockReactionsLabel( clientId );
	const blockInformation = useBlockDisplayInformation( clientId );

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
					target={ {
						kind: 'block',
						postId,
						reactionsId: reactionsId ?? '',
					} }
					reactions={ reactions }
					onToggleReaction={ toggleReaction }
					onRemoveLast={ onRemoveLast }
				>
					<AddReactionButton
						label={ __( 'Add block reaction' ) }
						onToggleReaction={ toggleReaction }
					/>
				</ReactionDisplay>
			</div>
		</ThemeProvider>
	);
}
