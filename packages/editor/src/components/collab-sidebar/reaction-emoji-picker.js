/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Composite } from '@wordpress/components';

/**
 * Curated emoji set for reactions.
 * The `value` slug is used as the storage key in the database to avoid
 * potential encoding issues with emoji characters.
 */
export const REACTION_EMOJIS = [
	{ emoji: '❤️', label: __( 'Heart' ), value: 'heart' },
	{ emoji: '🎉', label: __( 'Celebration' ), value: 'celebration' },
	{ emoji: '😄', label: __( 'Smile' ), value: 'smile' },
	{ emoji: '👀', label: __( 'Eyes' ), value: 'eyes' },
	{ emoji: '🚀', label: __( 'Rocket' ), value: 'rocket' },
];

/**
 * Reactions storage format:
 *
 * Curated picks are stored as their slug (e.g. `heart`). ASCII slugs
 * sidestep utf8/utf8mb4 charset portability issues on the comments table
 * and give stable grouping in the `reaction_summary` aggregation.
 */

/**
 * Build a Map keyed by slug for O(1) emoji and label lookups.
 *
 * @param {Array} emojis The emoji list to index.
 * @return {Map} Map from slug to `{ emoji, label, value }` entry.
 */
export function buildEmojiBySlugMap( emojis = REACTION_EMOJIS ) {
	return new Map( emojis.map( ( entry ) => [ entry.value, entry ] ) );
}

/**
 * A row of curated emoji buttons.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onSelect Called with the chosen slug when the
 *                                  user picks a curated emoji.
 */
export default function ReactionEmojiPicker( { onSelect } ) {
	return (
		<Composite
			role="listbox"
			orientation="horizontal"
			aria-label={ __( 'Select an emoji reaction' ) }
			className="editor-collab-sidebar-panel__emoji-picker"
		>
			{ REACTION_EMOJIS.map( ( { emoji, label, value } ) => (
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
