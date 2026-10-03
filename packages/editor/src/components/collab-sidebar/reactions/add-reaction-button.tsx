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

interface AddReactionButtonProps {
	disabled?: boolean;
	label?: string;
	onToggleReaction: ( hexKey: string ) => void;
}

/**
 * Standalone add-reaction button, opening the searchable emoji picker
 * with its "Frequently used" section seeded from the curated set.
 *
 * @param props                  Component props.
 * @param props.disabled         Whether the button is disabled (e.g. on a
 *                               resolved note thread).
 * @param props.label            Accessible name of the trigger and of the
 *                               picker popup. Defaults to "Add reaction".
 * @param props.onToggleReaction Callback to toggle a reaction.
 */
export function AddReactionButton( {
	disabled = false,
	label = __( 'Add reaction' ),
	onToggleReaction,
}: AddReactionButtonProps ) {
	return (
		<EmojiPicker
			label={ label }
			trigger={
				<IconButton
					size="small"
					// A plain glyph, per the design: no ring or fill at rest.
					variant="minimal"
					tone="neutral"
					className="editor-collab-sidebar-panel__add-reaction-button"
					icon={ reactionIcon }
					label={ label }
				/>
			}
			disabled={ disabled }
			onSelect={ ( emoji ) => onToggleReaction( emojiToHexKey( emoji ) ) }
		/>
	);
}
