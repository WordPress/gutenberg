import { _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

/**
 * A reaction emoji.
 */
export interface ReactionEmoji {
	emoji: string;
	// The storage key: lowercase code points padded to four digits and
	// joined by `-`, with U+FE0F stripped (e.g. `2764` for ❤️). ASCII keys
	// sidestep utf8/utf8mb4 portability issues on the comments table. The
	// server accepts the keys in the `wp_note_reaction_emojis` list.
	hexKey: string;
	label: string;
	sentenceLabel: string;
}

/**
 * The default reaction emoji, which carry the editor's own translations.
 * `label` names the emoji on its own
 * (picker items, the reaction count label). `sentenceLabel` is only used in
 * the "reacted with" sentences, so translators can give it whatever form
 * that phrase needs.
 */
export const REACTION_EMOJIS: ReactionEmoji[] = [
	{
		emoji: '👍',
		hexKey: '1f44d',
		label: _x( 'Thumbs up', 'emoji reaction' ),
		sentenceLabel: _x(
			'thumbs up',
			'emoji reaction, after "reacted with"'
		),
	},
	{
		emoji: '➕',
		hexKey: '2795',
		label: _x( 'Plus', 'emoji reaction' ),
		sentenceLabel: _x( 'plus', 'emoji reaction, after "reacted with"' ),
	},
	{
		emoji: '❤️',
		hexKey: '2764',
		label: _x( 'Heart', 'emoji reaction' ),
		sentenceLabel: _x( 'heart', 'emoji reaction, after "reacted with"' ),
	},
	{
		emoji: '🎉',
		hexKey: '1f389',
		label: _x( 'Celebration', 'emoji reaction' ),
		sentenceLabel: _x(
			'celebration',
			'emoji reaction, after "reacted with"'
		),
	},
	{
		emoji: '😄',
		hexKey: '1f604',
		label: _x( 'Smile', 'emoji reaction' ),
		sentenceLabel: _x( 'smile', 'emoji reaction, after "reacted with"' ),
	},
	{
		emoji: '👀',
		hexKey: '1f440',
		label: _x( 'Eyes', 'emoji reaction' ),
		sentenceLabel: _x( 'eyes', 'emoji reaction, after "reacted with"' ),
	},
	{
		emoji: '🚀',
		hexKey: '1f680',
		label: _x( 'Rocket', 'emoji reaction' ),
		sentenceLabel: _x( 'rocket', 'emoji reaction, after "reacted with"' ),
	},
];

const HEX_KEY_PATTERN = /^[0-9a-f]{4,6}(?:-[0-9a-f]{4,6})*$/;
const EMOJI_PATTERN = /^\p{Emoji}$/u;
const EMOJI_PRESENTATION_PATTERN = /^\p{Emoji_Presentation}$/u;
const SKIN_TONE_PATTERN = /^[\u{1F3FB}-\u{1F3FF}]$/u;

/**
 * The emoji stored under a hex key.
 *
 * The key drops U+FE0F, so it goes back after each code point that defaults
 * to text presentation: ❤️ would otherwise render as text, and sequences
 * such as #️⃣ and 🏳️‍🌈 are only fully qualified with it. A skin tone
 * already forces emoji presentation.
 *
 * @param hexKey The storage key, e.g. `2764`.
 * @return The emoji, or an empty string for a malformed key.
 */
export function hexKeyToEmoji( hexKey: string ): string {
	if ( ! HEX_KEY_PATTERN.test( hexKey ) ) {
		return '';
	}
	const codePoints = hexKey
		.split( '-' )
		.map( ( codePoint ) => parseInt( codePoint, 16 ) );
	if ( codePoints.some( ( codePoint ) => codePoint > 0x10ffff ) ) {
		return '';
	}
	const chars = codePoints.map( ( codePoint ) =>
		String.fromCodePoint( codePoint )
	);
	return chars
		.map( ( char, index ) => {
			const next = chars[ index + 1 ];
			const needsSelector =
				EMOJI_PATTERN.test( char ) &&
				! EMOJI_PRESENTATION_PATTERN.test( char ) &&
				! ( next && SKIN_TONE_PATTERN.test( next ) );
			return needsSelector ? char + '\u{FE0F}' : char;
		} )
		.join( '' );
}

/**
 * The reaction emoji the editor offers, from the private
 * `getNoteReactionEmojis` selector. The server builds the list from the
 * `wp_note_reaction_emojis` filter, so the picker offers the same emoji the
 * REST API accepts. Offers none when the list is missing, since the
 * accepted emoji are then unknown.
 *
 * @return The reaction emoji, in display order.
 */
export function useReactionEmojis(): ReactionEmoji[] {
	const setting: unknown = useSelect(
		( select ) => unlock( select( editorStore ) ).getNoteReactionEmojis(),
		[]
	);
	return getReactionEmojisFromSetting( setting );
}

const NO_EMOJIS: ReactionEmoji[] = [];

const settingCache = new WeakMap< object, ReactionEmoji[] >();

/**
 * Builds the reaction emoji from the `noteReactionEmojis` editor setting,
 * dropping malformed entries. A default emoji keeps the editor's labels,
 * which have a standalone and a mid-sentence form; any other emoji uses the
 * server's label for both.
 *
 * @param setting The setting's value.
 * @return The reaction emoji, or none when the setting is not a list.
 */
export function getReactionEmojisFromSetting(
	setting: unknown
): ReactionEmoji[] {
	if ( ! Array.isArray( setting ) ) {
		return NO_EMOJIS;
	}
	// The setting keeps its identity between renders, so the list does too.
	let emojis = settingCache.get( setting );
	if ( ! emojis ) {
		emojis = setting.flatMap( ( entry ) => {
			if (
				! entry ||
				typeof entry.hexKey !== 'string' ||
				typeof entry.label !== 'string'
			) {
				return [];
			}
			const emoji = hexKeyToEmoji( entry.hexKey );
			if ( ! emoji ) {
				return [];
			}
			const known = REACTION_EMOJIS.find(
				( { hexKey } ) => hexKey === entry.hexKey
			);
			return [
				known ?? {
					emoji,
					hexKey: entry.hexKey,
					label: entry.label,
					sentenceLabel: entry.label,
				},
			];
		} );
		settingCache.set( setting, emojis );
	}
	return emojis;
}

/**
 * The reaction emoji stored under a hex key.
 *
 * @param emojis The reaction emoji to look in.
 * @param hexKey The storage key, e.g. `2764`.
 * @return The reaction emoji, or undefined for a key not in the list.
 */
export function getReactionEmoji(
	emojis: ReactionEmoji[],
	hexKey: string
): ReactionEmoji | undefined {
	return emojis.find( ( entry ) => entry.hexKey === hexKey );
}
