/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Button, Composite } from '@wordpress/components';
import { plus as plusIcon } from '@wordpress/icons';

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
	onMore?: () => void;
	onMoreHover?: () => void;
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
 * - Curated picks (5 default emojis) are stored as their slug, e.g. `heart`.
 * - Picks from the full searchable picker are stored as a lowercase
 *   hex-codepoint sequence joined by `-`, e.g. `1f44d` for 👍 or
 *   `1f468-200d-1f4bb` for 👨‍💻. Variation selector U+FE0F is stripped
 *   so `2764-fe0f` (❤️) collapses into the curated `heart` slug.
 *
 * Storing an ASCII slug or hex sidesteps utf8/utf8mb4 charset portability
 * issues on the comments table and gives stable grouping in the
 * `reaction_summary` aggregation.
 */

const HEX_KEY_RE = /^[0-9a-f]{2,6}(-[0-9a-f]{2,6})*$/;

/**
 * Convert an emoji character to its lowercase hex-codepoint sequence,
 * stripping variation selector U+FE0F so visually equivalent
 * presentations collapse to the same key.
 *
 * @param emoji The emoji character.
 * @return Lowercase hex codepoints joined by `-`.
 */
export function emojiToHexKey( emoji: string ): string {
	if ( typeof emoji !== 'string' || ! emoji ) {
		return '';
	}
	return Array.from( emoji.replace( /️/g, '' ) )
		.map( ( c ) => ( c.codePointAt( 0 ) as number ).toString( 16 ) )
		.join( '-' );
}

/**
 * Convert a hex-codepoint sequence back to its emoji character.
 *
 * @param hexKey Lowercase hex codepoints joined by `-`.
 * @return The emoji character, or the input on parse failure.
 */
export function hexKeyToEmoji( hexKey: string ): string {
	if ( typeof hexKey !== 'string' || ! HEX_KEY_RE.test( hexKey ) ) {
		return hexKey;
	}
	try {
		return String.fromCodePoint(
			...hexKey.split( '-' ).map( ( p ) => parseInt( p, 16 ) )
		);
	} catch {
		return hexKey;
	}
}

/**
 * Map a chosen emoji character to its storage key. If the emoji matches
 * a curated reaction (after stripping VS-16) returns its slug, otherwise
 * returns the hex-codepoint key.
 *
 * @param emoji  The emoji character.
 * @param emojis Curated emoji list to match against.
 * @return The storage key (slug or hex codepoints).
 */
export function emojiToStorageKey(
	emoji: string,
	emojis: CuratedEmoji[] = REACTION_EMOJIS
): string {
	const hex = emojiToHexKey( emoji );
	const curated = emojis.find( ( r ) => emojiToHexKey( r.emoji ) === hex );
	return curated ? curated.value : hex;
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
 * A row of curated emoji buttons, optionally followed by a `+` "More
 * emojis" trigger that hands off to the full searchable picker. The `+`
 * is a plain button rendered after the listbox (not inside it) so the
 * listbox only contains selectable options.
 *
 * @param props             Component props.
 * @param props.onSelect    Called with the chosen slug when the user picks a
 *                          curated emoji.
 * @param props.onMore      When provided, renders the trailing `+` button and
 *                          is called when it is clicked.
 * @param props.onMoreHover Called when the `+` button is hovered or focused
 *                          (used to prefetch the full picker).
 */
export default function ReactionEmojiPicker( {
	onSelect,
	onMore,
	onMoreHover,
}: ReactionEmojiPickerProps ) {
	return (
		<div className="editor-collab-sidebar-panel__emoji-picker-row">
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
			{ onMore && (
				<Button
					size="compact"
					icon={ plusIcon }
					label={ __( 'More emojis' ) }
					className="editor-collab-sidebar-panel__emoji-option"
					onClick={ onMore }
					onMouseEnter={ onMoreHover }
					onFocus={ onMoreHover }
				/>
			) }
		</div>
	);
}
