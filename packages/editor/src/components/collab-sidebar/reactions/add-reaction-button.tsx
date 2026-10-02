import { __ } from '@wordpress/i18n';
/*
 * `IconButton` is pending Design System review (WordPress/gutenberg#76135);
 * used here so the trigger matches the reaction pills beside it.
 */
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton } from '@wordpress/ui';
import { reaction as reactionIcon } from '@wordpress/icons';
import EmojiPicker from './emoji-picker';
import {
	emojiToStorageKey,
	useReactionEmojiRules,
	useReactionEmojis,
} from './reaction-emojis';
import { useEmojibaseConfig } from './emojibase-data';

interface AddReactionButtonProps {
	disabled?: boolean;
	onToggleReaction: ( slug: string ) => void;
}

/**
 * Standalone add-reaction button, opening the searchable emoji picker
 * with its "Frequently used" section seeded from the named set.
 *
 * @param props                  Component props.
 * @param props.disabled         Whether the button is disabled (e.g. on a
 *                               resolved note thread).
 * @param props.onToggleReaction Callback to toggle a reaction.
 */
export function AddReactionButton( {
	disabled = false,
	onToggleReaction,
}: AddReactionButtonProps ) {
	const emojis = useReactionEmojis();
	const rules = useReactionEmojiRules();
	const { baseUrl } = useEmojibaseConfig();

	// With an emptied named list and no dataset, or a dataset limited to
	// that list, there is nothing to pick.
	if ( ! emojis.length && ( ! baseUrl || ! rules.allowUnlisted ) ) {
		return null;
	}

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
			disabled={ disabled }
			onSelect={ ( emoji ) =>
				onToggleReaction( emojiToStorageKey( emoji, emojis ) )
			}
		/>
	);
}
