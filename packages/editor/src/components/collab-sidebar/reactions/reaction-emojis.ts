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
	sentenceLabel: string;
}

/**
 * The emoji a note can be reacted with. `label` names the emoji on its own
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

/**
 * The reaction emoji stored under a hex key.
 *
 * @param hexKey The storage key, e.g. `2764`.
 * @return The reaction emoji, or undefined for an unknown key.
 */
export function getReactionEmoji( hexKey: string ): ReactionEmoji | undefined {
	return REACTION_EMOJIS.find( ( entry ) => entry.hexKey === hexKey );
}
