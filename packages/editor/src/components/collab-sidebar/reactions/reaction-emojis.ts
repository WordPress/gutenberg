import { _x } from '@wordpress/i18n';

/**
 * A single curated reaction emoji.
 */
export interface CuratedEmoji {
	emoji: string;
	label: string;
}

/**
 * Curated emoji set for reactions, seeding "Frequently used" and naming
 * these emoji with their own translated labels.
 */
export const REACTION_EMOJIS: CuratedEmoji[] = [
	{ emoji: '❤️', label: _x( 'Heart', 'emoji reaction' ) },
	{ emoji: '🎉', label: _x( 'Celebration', 'emoji reaction' ) },
	{ emoji: '😄', label: _x( 'Smile', 'emoji reaction' ) },
	{ emoji: '👀', label: _x( 'Eyes', 'emoji reaction' ) },
	{ emoji: '🚀', label: _x( 'Rocket', 'emoji reaction' ) },
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
