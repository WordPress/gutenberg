import { __, _x } from '@wordpress/i18n';
import { Button, Composite } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
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
 * - Curated picks (5 default emojis) are stored as their slug, e.g. `heart`.
 * - Picks from the full searchable picker are stored as a lowercase
 *   hex-codepoint sequence joined by `-`, e.g. `1f44d` for 👍 or
 *   `1f468-200d-1f4bb` for 👨‍💻. Variation selector U+FE0F is stripped
 *   so `2764-fe0f` (❤️) collapses into the curated `heart` slug, and each
 *   code point is zero-padded to at least four digits so the key matches
 *   the Emojibase `hexcode` field it is looked up against.
 *
 * Storing an ASCII slug or hex sidesteps utf8/utf8mb4 charset portability
 * issues on the comments table and gives stable grouping in the
 * `reaction_summary` aggregation.
 */

// Keys written before the padding rule can be two digits wide, so reading
// stays lenient even though writing always pads.
const HEX_KEY_RE = /^[0-9a-f]{2,6}(-[0-9a-f]{2,6})*$/;

const VARIATION_SELECTOR = '\u{FE0F}';
const EMOJI_RE = /^\p{Emoji}$/u;
const EMOJI_PRESENTATION_RE = /^\p{Emoji_Presentation}$/u;
const SKIN_TONE_RE = /^[\u{1F3FB}-\u{1F3FF}]$/u;

/**
 * Convert an emoji character to its lowercase hex-codepoint sequence,
 * stripping variation selector U+FE0F so visually equivalent
 * presentations collapse to the same key.
 *
 * Each code point is zero-padded to four digits, matching how Emojibase
 * writes its `hexcode` field (`00a9`, not `a9`). Without the padding the
 * dozen-odd emoji below U+1000 -- ©, ® and the keycaps -- would never match
 * a dataset entry, silently losing their label and their place in the
 * frequently-used row.
 *
 * @param emoji The emoji character.
 * @return Lowercase hex codepoints joined by `-`.
 */
export function emojiToHexKey( emoji: string ): string {
	if ( typeof emoji !== 'string' || ! emoji ) {
		return '';
	}
	return Array.from( emoji.replace( /\u{FE0F}/gu, '' ) )
		.map( ( c ) =>
			( c.codePointAt( 0 ) as number ).toString( 16 ).padStart( 4, '0' )
		)
		.join( '-' );
}

/**
 * Whether a code point needs U+FE0F appended to render as a colour emoji.
 *
 * Text-presentation emoji (❤, ☺, the keycap digits) draw as monochrome
 * glyphs without it, and a ZWJ sequence built from them is only
 * recognized in its fully-qualified form. A skin-tone modifier already
 * forces emoji presentation on the base it follows, so inserting the
 * selector there would instead break the sequence apart.
 *
 * @param char The code point.
 * @param next The code point that follows it, if any.
 * @return Whether the variation selector is required.
 */
function needsVariationSelector(
	char: string,
	next: string | undefined
): boolean {
	return (
		EMOJI_RE.test( char ) &&
		! EMOJI_PRESENTATION_RE.test( char ) &&
		! ( next !== undefined && SKIN_TONE_RE.test( next ) )
	);
}

/**
 * Convert a hex-codepoint sequence back to its emoji character,
 * restoring the variation selectors that `emojiToHexKey()` stripped.
 *
 * @param hexKey Lowercase hex codepoints joined by `-`.
 * @return The emoji character, or the input on parse failure.
 */
export function hexKeyToEmoji( hexKey: string ): string {
	if ( typeof hexKey !== 'string' || ! HEX_KEY_RE.test( hexKey ) ) {
		return hexKey;
	}
	try {
		const chars = hexKey
			.split( '-' )
			.map( ( p ) => String.fromCodePoint( parseInt( p, 16 ) ) );
		return chars
			.map( ( char, index ) =>
				needsVariationSelector( char, chars[ index + 1 ] )
					? char + VARIATION_SELECTOR
					: char
			)
			.join( '' );
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
 * A row of curated emoji buttons: the fallback picker offered when no
 * Emojibase URL is configured (npm consumers of the editor package that
 * haven't opted into the full searchable picker).
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
