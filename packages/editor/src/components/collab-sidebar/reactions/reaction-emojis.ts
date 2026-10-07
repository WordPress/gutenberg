import { _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * A single curated reaction emoji.
 */
export interface CuratedEmoji {
	emoji: string;
	label: string;
}

/**
 * Curated emoji set for reactions, seeding "Frequently used" and naming
 * these emoji with their own translated labels. Lowercase, like the
 * Emojibase names around them, since they also appear mid-sentence
 * ("Adam reacted with heart").
 */
export const REACTION_EMOJIS: CuratedEmoji[] = [
	{ emoji: '❤️', label: _x( 'heart', 'emoji reaction' ) },
	{ emoji: '🎉', label: _x( 'celebration', 'emoji reaction' ) },
	{ emoji: '😄', label: _x( 'smile', 'emoji reaction' ) },
	{ emoji: '👀', label: _x( 'eyes', 'emoji reaction' ) },
	{ emoji: '🚀', label: _x( 'rocket', 'emoji reaction' ) },
];

/**
 * Reactions storage format: every reaction, curated or not, is stored as
 * lowercase hex code points joined by `-`, e.g. `2764` or `1f44d`. U+FE0F
 * is stripped so both presentations of an emoji share one key, and each
 * code point is padded to four digits to match the Emojibase `hexcode`
 * field.
 *
 * ASCII keys sidestep utf8/utf8mb4 portability issues on the comments
 * table and group stably in the `reaction_summary` aggregation.
 */

const HEX_KEY_RE = /^[0-9a-f]{4,6}(-[0-9a-f]{4,6})*$/;

const VARIATION_SELECTOR = '\u{FE0F}';
const EMOJI_RE = /^\p{Emoji}$/u;
const EMOJI_PRESENTATION_RE = /^\p{Emoji_Presentation}$/u;
const SKIN_TONE_RE = /^[\u{1F3FB}-\u{1F3FF}]$/u;

/**
 * Convert an emoji to its lowercase hex-codepoint sequence, stripping
 * U+FE0F so equivalent presentations collapse to one key.
 *
 * Code points are padded to four digits as Emojibase writes them (`00a9`,
 * not `a9`); unpadded, the emoji below U+1000 such as © and the keycaps
 * would never match a dataset entry.
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
 * Whether a code point needs U+FE0F to render as a colour emoji.
 *
 * Text-presentation emoji such as ❤ and the keycap digits draw as
 * monochrome without it, and ZWJ sequences are only recognized fully
 * qualified. A skin-tone modifier already forces emoji presentation, so
 * adding the selector there would break the sequence apart.
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
 * The translated label of a curated reaction, so the full picker and the
 * pills name it the same way the quick reactions do.
 *
 * @param hexKey Normalized hex key, e.g. `2764`.
 * @return The curated label, or undefined for any other emoji.
 */
export function getCuratedLabel( hexKey: string ): string | undefined {
	return REACTION_EMOJIS.find(
		( entry ) => emojiToHexKey( entry.emoji ) === hexKey
	)?.label;
}

/**
 * A named reaction emoji from the `noteReactionEmojis` setting.
 */
export interface NamedEmoji {
	hexKey: string;
	label: string;
}

/**
 * Read the named emoji list from the raw editor setting, falling back to
 * the curated set only when the setting is absent. Malformed entries drop,
 * and an emptied list stays empty.
 *
 * @param raw The `noteReactionEmojis` setting.
 * @return The named emoji.
 */
export function parseReactionEmojis( raw: unknown ): NamedEmoji[] {
	if ( ! Array.isArray( raw ) ) {
		return REACTION_EMOJIS.map( ( { emoji, label } ) => ( {
			hexKey: emojiToHexKey( emoji ),
			label,
		} ) );
	}
	return raw
		.filter(
			( entry ): entry is { hexcode: string; label: string } =>
				!! entry &&
				typeof entry.hexcode === 'string' &&
				typeof entry.label === 'string'
		)
		.map( ( { hexcode, label } ) => ( {
			hexKey: hexcode.toLowerCase(),
			label,
		} ) )
		.filter( ( entry ) => HEX_KEY_RE.test( entry.hexKey ) );
}

/**
 * The named emoji from editor settings. The server injects them via
 * `gutenberg_note_reaction_emoji_settings`, so "Frequently used" starts
 * from the set the site chose.
 *
 * @return The named emoji.
 */
export function useReactionEmojis(): NamedEmoji[] {
	const raw = useSelect(
		( select ) =>
			(
				select( blockEditorStore ).getSettings() as Record<
					string,
					unknown
				>
			 ).noteReactionEmojis,
		[]
	);
	return useMemo( () => parseReactionEmojis( raw ), [ raw ] );
}

/**
 * Which emoji the picker offers beyond the named list. Mirrors the
 * `allow_unlisted` and `exclude` from the server's
 * `gutenberg_note_reaction_emoji_settings`.
 */
export interface ReactionEmojiRules {
	allowUnlisted: boolean;
	// Base hex keys that are never accepted.
	exclude: string[];
}

const DEFAULT_REACTION_EMOJI_RULES: ReactionEmojiRules = {
	allowUnlisted: true,
	exclude: [],
};

/**
 * Drop skin-tone modifiers so a variant resolves to its base emoji.
 *
 * @param hexKey Normalized hex key.
 * @return The base emoji's hex key.
 */
function stripSkinTones( hexKey: string ): string {
	return hexKey
		.split( '-' )
		.filter( ( part ) => ! /^1f3f[b-f]$/.test( part ) )
		.join( '-' );
}

/**
 * Read the emoji rules from the raw editor setting, defaulting to any emoji
 * when it is absent or malformed.
 *
 * @param raw The `noteReactionEmojiRules` setting.
 * @return The parsed rules.
 */
export function parseReactionEmojiRules( raw: unknown ): ReactionEmojiRules {
	if ( ! raw || typeof raw !== 'object' ) {
		return DEFAULT_REACTION_EMOJI_RULES;
	}
	const { allowUnlisted, exclude } = raw as Record< string, unknown >;
	return {
		allowUnlisted: allowUnlisted !== false,
		exclude: Array.isArray( exclude )
			? exclude
					.filter( ( key ): key is string => typeof key === 'string' )
					.map( ( key ) => key.toLowerCase() )
			: [],
	};
}

/**
 * The emoji rules from editor settings.
 *
 * @return The rules the REST API applies to reactions.
 */
export function useReactionEmojiRules(): ReactionEmojiRules {
	const raw = useSelect(
		( select ) =>
			(
				select( blockEditorStore ).getSettings() as Record<
					string,
					unknown
				>
			 ).noteReactionEmojiRules,
		[]
	);
	return useMemo( () => parseReactionEmojiRules( raw ), [ raw ] );
}

/**
 * Base hex keys of the named emoji, which the rules always accept.
 *
 * @param emojis The named emoji.
 * @return Set of base hex keys.
 */
export function getNamedHexKeys( emojis: NamedEmoji[] ): Set< string > {
	return new Set( emojis.map( ( entry ) => stripSkinTones( entry.hexKey ) ) );
}

/**
 * Whether the rules accept an emoji. Named emoji are always accepted, and
 * skin-tone variants follow their base emoji. Must agree with
 * `gutenberg_is_note_reaction_hex_key_allowed()`.
 *
 * @param hexKey    Normalized hex key of the emoji.
 * @param rules     The emoji rules.
 * @param namedKeys Hex keys from `getNamedHexKeys()`.
 * @return Whether the emoji can be used as a reaction.
 */
export function isReactionEmojiAllowed(
	hexKey: string,
	rules: ReactionEmojiRules,
	namedKeys: Set< string >
): boolean {
	const base = stripSkinTones( hexKey );
	if ( namedKeys.has( base ) ) {
		return true;
	}
	return rules.allowUnlisted && ! rules.exclude.includes( base );
}
