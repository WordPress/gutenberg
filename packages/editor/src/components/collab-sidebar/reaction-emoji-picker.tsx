/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Button, Composite } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor.
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * A single curated reaction emoji.
 */
export interface CuratedEmoji {
	emoji: string;
	label: string;
	value: string;
}

interface ReactionEmojiPickerProps {
	onSelect: ( slug: string ) => void;
}

/**
 * Curated emoji set for reactions.
 * The `value` slug is used as the storage key in the database to avoid
 * potential encoding issues with emoji characters.
 */
export const REACTION_EMOJIS: CuratedEmoji[] = [
	{ emoji: '❤️', label: _x( 'Heart', 'emoji reaction' ), value: 'heart' },
	{
		emoji: '🎉',
		label: _x( 'Celebration', 'emoji reaction' ),
		value: 'celebration',
	},
	{ emoji: '😄', label: _x( 'Smile', 'emoji reaction' ), value: 'smile' },
	{ emoji: '👀', label: _x( 'Eyes', 'emoji reaction' ), value: 'eyes' },
	{ emoji: '🚀', label: _x( 'Rocket', 'emoji reaction' ), value: 'rocket' },
];

/**
 * Reactions storage format:
 *
 * Curated picks are stored as their slug (e.g. `heart`). ASCII slugs
 * sidestep utf8/utf8mb4 charset portability issues on the comments table
 * and give stable grouping in the `reaction_summary` aggregation.
 */

/**
 * Returns the reaction emoji list from block editor settings, falling
 * back to the curated defaults. The server injects the list via the
 * `gutenberg_note_reaction_emojis` PHP filter, so the picker offers the
 * same set the REST API accepts. Malformed entries are dropped.
 *
 * @return The emoji list to offer in the picker.
 */
export function useReactionEmojis(): CuratedEmoji[] {
	return useSelect( ( select ) => {
		const settings: Record< string, unknown > =
			select( blockEditorStore ).getSettings();
		const emojis = settings.noteReactionEmojis;
		if ( ! Array.isArray( emojis ) ) {
			return REACTION_EMOJIS;
		}
		const valid = emojis.filter(
			( entry ): entry is CuratedEmoji =>
				!! entry &&
				typeof entry.emoji === 'string' &&
				typeof entry.label === 'string' &&
				typeof entry.value === 'string'
		);
		return valid.length ? valid : REACTION_EMOJIS;
	}, [] );
}

/**
 * Build a Map keyed by slug for O(1) emoji and label lookups.
 *
 * @param emojis The emoji list to index.
 * @return Map from slug to `{ emoji, label, value }` entry.
 */
export function buildEmojiBySlugMap(
	emojis: CuratedEmoji[] = REACTION_EMOJIS
): Map< string, CuratedEmoji > {
	return new Map( emojis.map( ( entry ) => [ entry.value, entry ] ) );
}

/**
 * A row of curated emoji buttons.
 *
 * @param props          Component props.
 * @param props.onSelect Called with the chosen slug when the user picks a
 *                       curated emoji.
 */
export default function ReactionEmojiPicker( {
	onSelect,
}: ReactionEmojiPickerProps ) {
	const emojis = useReactionEmojis();

	return (
		<Composite
			role="listbox"
			/*
			 * No `orientation`: the list wraps into rows once the emoji set is
			 * extended past a single row, and a narrow popover can stack it
			 * into a column, so both axes need to move the roving tab index.
			 */
			aria-label={ __( 'Select an emoji reaction' ) }
			className="editor-collab-sidebar-panel__emoji-picker"
		>
			{ emojis.map( ( { emoji, label, value } ) => (
				<Composite.Item
					key={ value }
					render={
						<Button
							role="option"
							size="compact"
							onClick={ () => onSelect( value ) }
							aria-label={ label }
							className="editor-collab-sidebar-panel__emoji-option"
						/>
					}
				>
					{ emoji }
				</Composite.Item>
			) ) }
		</Composite>
	);
}
