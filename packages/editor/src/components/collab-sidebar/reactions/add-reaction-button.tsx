import { __ } from '@wordpress/i18n';
/*
 * `IconButton` is pending Design System review (WordPress/gutenberg#76135);
 * used here so the trigger matches the reaction pills beside it.
 */
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton } from '@wordpress/ui';
import { reaction as reactionIcon } from '@wordpress/icons';
import EmojiPicker from './emoji-picker';
import { emojiToHexKey } from './reaction-emojis';
import { hasUserReacted } from './reaction-display';
import type { ReactionSummary } from './reaction-display';

interface AddReactionButtonProps {
	reactions?: ReactionSummary | null;
	onToggleReaction: ( hexKey: string ) => void;
}

/**
 * Standalone add-reaction button, opening the searchable emoji picker
 * with its "Frequently used" section seeded from the curated set.
 *
 * @param props                  Component props.
 * @param props.reactions        The note's reaction summary, used to mark the
 *                               emoji the current user has already reacted with.
 * @param props.onToggleReaction Callback to toggle a reaction.
 */
export function AddReactionButton( {
	reactions,
	onToggleReaction,
}: AddReactionButtonProps ) {
	const reactedHexKeys = Object.keys( reactions ?? {} ).filter( ( hexKey ) =>
		hasUserReacted( reactions, hexKey )
	);

	return (
		<EmojiPicker
			label={ __( 'Add reaction' ) }
			trigger={
				<IconButton
					size="small"
					// A plain glyph, per the design: no ring or fill at rest.
					variant="minimal"
					tone="neutral"
					className="editor-collab-sidebar-panel__add-reaction-button"
					icon={ reactionIcon }
					label={ __( 'Add reaction' ) }
				/>
			}
			reactedHexKeys={ reactedHexKeys }
			onSelect={ ( emoji ) => onToggleReaction( emojiToHexKey( emoji ) ) }
		/>
	);
}
