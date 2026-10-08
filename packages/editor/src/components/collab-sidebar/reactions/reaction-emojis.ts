import { useSelect } from '@wordpress/data';
import { store as editorStore } from '../../../store';

/**
 * A reaction emoji.
 */
export interface ReactionEmoji {
	emoji: string;
	// The storage key: lowercase code points padded to four digits and
	// joined by `-`, with U+FE0F stripped (e.g. `2764` for ❤️). ASCII keys
	// sidestep utf8/utf8mb4 portability issues on the comments table. The
	// server accepts exactly these keys.
	hexKey: string;
	label: string;
}

const HEX_KEY_PATTERN = /^[0-9a-f]{4,6}(?:-[0-9a-f]{4,6})*$/;

/**
 * The emoji stored under a hex key.
 *
 * A single code point gets U+FE0F back, which the key drops, so emoji such
 * as ❤️ that default to text presentation still render as emoji.
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
	if ( codePoints.length === 1 ) {
		codePoints.push( 0xfe0f );
	}
	return String.fromCodePoint( ...codePoints );
}

/**
 * The reaction emoji the editor offers: the `noteReactionEmojis` editor
 * setting, which the server builds from the `wp_note_reaction_emojis`
 * filter so the menu offers the same emoji the REST API accepts. Offers none
 * when the setting is missing, since the accepted emoji are then unknown.
 *
 * @return The reaction emoji, in display order.
 */
export function useReactionEmojis(): ReactionEmoji[] {
	const setting: unknown = useSelect(
		( select ) =>
			// @ts-expect-error Editor settings are typed as a bare `Object`.
			select( editorStore ).getEditorSettings().noteReactionEmojis,
		[]
	);
	return getReactionEmojisFromSetting( setting );
}

const NO_EMOJIS: ReactionEmoji[] = [];

const settingCache = new WeakMap< object, ReactionEmoji[] >();

/**
 * Builds the reaction emoji from the `noteReactionEmojis` editor setting,
 * dropping malformed entries.
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
			return emoji
				? [ { emoji, hexKey: entry.hexKey, label: entry.label } ]
				: [];
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
