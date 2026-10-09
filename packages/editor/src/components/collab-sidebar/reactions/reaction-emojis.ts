import { _x } from '@wordpress/i18n';

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

/**
 * The emoji a note can be reacted with. Labels are lowercase since they
 * also appear mid-sentence ("Adam reacted with heart").
 */
export const REACTION_EMOJIS: ReactionEmoji[] = [
	{ emoji: '❤️', hexKey: '2764', label: _x( 'heart', 'emoji reaction' ) },
	{
		emoji: '🎉',
		hexKey: '1f389',
		label: _x( 'celebration', 'emoji reaction' ),
	},
	{ emoji: '😄', hexKey: '1f604', label: _x( 'smile', 'emoji reaction' ) },
	{ emoji: '👀', hexKey: '1f440', label: _x( 'eyes', 'emoji reaction' ) },
	{ emoji: '🚀', hexKey: '1f680', label: _x( 'rocket', 'emoji reaction' ) },
];

/**
 * The reaction emoji stored under a hex key.
 *
 * @param hexKey The storage key, e.g. `2764`.
 * @return The reaction emoji, or undefined for an unknown key.
 */
export function getReactionEmoji( hexKey: string ): ReactionEmoji | undefined {
	return REACTION_EMOJIS.find( ( entry ) => entry.hexKey === hexKey );
}
