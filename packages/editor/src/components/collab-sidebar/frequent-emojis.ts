/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect, useRegistry } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { REACTION_EMOJIS, emojiToHexKey } from './reaction-emoji-picker';

/**
 * A recorded frequently-used emoji: its normalized hex key and how many
 * times the user has picked it.
 */
export interface FrequentEmojiEntry {
	key: string;
	count: number;
}

/**
 * Preference key (in the `core` scope) storing the user's frequently
 * used emoji as an ordered array of `{ key, count }` entries, where
 * `key` is the normalized hex key of the base (untoned) emoji and
 * `count` is how many times it has been picked. The array is kept
 * sorted by count (descending) with ties broken by recency, and capped
 * at `MAX_FREQUENT_EMOJIS`.
 */
export const FREQUENT_EMOJIS_PREFERENCE_KEY = 'emojiPickerFrequentEmojis';

/**
 * Cap on stored frequently-used emoji: four rows of the picker's
 * 8-column grid. Once full, the least used entry is discarded when a
 * new emoji is picked.
 */
export const MAX_FREQUENT_EMOJIS = 32;

/**
 * Hex keys of the curated reaction set, used to seed the
 * frequently-used section before the user has picked anything. The
 * seeds are never persisted — they are appended at display time and
 * fall away as real usage fills the list.
 */
export const DEFAULT_FREQUENT_EMOJI_KEYS = REACTION_EMOJIS.map( ( entry ) =>
	emojiToHexKey( entry.emoji )
);

/**
 * Drop malformed entries from a stored preference value so a corrupt
 * or legacy value can never break the picker.
 *
 * @param entries The raw preference value.
 * @return Sanitized entries.
 */
function sanitizeEntries( entries: unknown ): FrequentEmojiEntry[] {
	if ( ! Array.isArray( entries ) ) {
		return [];
	}
	return entries.filter(
		( entry ): entry is FrequentEmojiEntry =>
			!! entry &&
			typeof entry.key === 'string' &&
			!! entry.key &&
			typeof entry.count === 'number' &&
			Number.isFinite( entry.count ) &&
			entry.count > 0
	);
}

/**
 * Return a new usage list with one more use of `key` recorded. The
 * bumped entry is placed ahead of entries with the same or a lower
 * count (frequency first, recency as the tie-break). When the list
 * exceeds `MAX_FREQUENT_EMOJIS`, the least used entry — other than the
 * one just recorded — is discarded, so a newly picked emoji always
 * makes it into the list.
 *
 * @param entries Current `{ key, count }` entries.
 * @param key     Normalized hex key of the picked emoji.
 * @return The updated entries.
 */
export function recordEmojiUse(
	entries: unknown,
	key: string
): FrequentEmojiEntry[] {
	const list = sanitizeEntries( entries );
	if ( ! key || typeof key !== 'string' ) {
		return list;
	}
	const count = ( list.find( ( e ) => e.key === key )?.count || 0 ) + 1;
	const next = list.filter( ( e ) => e.key !== key );
	const index = next.findIndex( ( e ) => e.count <= count );
	next.splice( index === -1 ? next.length : index, 0, { key, count } );
	while ( next.length > MAX_FREQUENT_EMOJIS ) {
		// Evict from the tail (lowest count, least recent among ties),
		// skipping the just-recorded key.
		let evictIndex = next.length - 1;
		if ( next[ evictIndex ].key === key ) {
			evictIndex -= 1;
		}
		next.splice( evictIndex, 1 );
	}
	return next;
}

/**
 * Resolve the ordered list of hex keys to show in the "Frequently
 * used" section: recorded usage first (already sorted by frequency),
 * padded with the curated default reactions the user hasn't recorded
 * yet, capped at `MAX_FREQUENT_EMOJIS`.
 *
 * @param entries Stored `{ key, count }` entries.
 * @return Ordered hex keys.
 */
export function getFrequentEmojiKeys( entries: unknown ): string[] {
	const keys = sanitizeEntries( entries ).map( ( entry ) => entry.key );
	const seen = new Set( keys );
	for ( const key of DEFAULT_FREQUENT_EMOJI_KEYS ) {
		if ( ! seen.has( key ) ) {
			keys.push( key );
			seen.add( key );
		}
	}
	return keys.slice( 0, MAX_FREQUENT_EMOJIS );
}

/**
 * Hook exposing the persisted frequently-used emoji list and a
 * `recordUse` callback. Usage is stored per user through the
 * preferences store (`core` scope), the same channel as the skin tone
 * preference, so it follows the user across sessions and browsers.
 *
 * @return The display-ready hex keys and the usage recorder.
 */
export function useFrequentEmojis(): {
	frequentKeys: string[];
	recordUse: ( key: string ) => void;
} {
	const registry = useRegistry();
	const frequentKeys = useSelect(
		( select ) =>
			getFrequentEmojiKeys(
				select( preferencesStore ).get(
					'core',
					FREQUENT_EMOJIS_PREFERENCE_KEY
				)
			),
		[]
	);
	const recordUse = useCallback(
		( key: string ) => {
			// Read the latest stored value at call time so back-to-back
			// picks never clobber each other through a stale closure.
			const entries = registry
				.select( preferencesStore )
				.get( 'core', FREQUENT_EMOJIS_PREFERENCE_KEY );
			registry
				.dispatch( preferencesStore )
				.set(
					'core',
					FREQUENT_EMOJIS_PREFERENCE_KEY,
					recordEmojiUse( entries, key )
				);
		},
		[ registry ]
	);
	return { frequentKeys, recordUse };
}
