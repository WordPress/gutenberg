import { useCallback } from '@wordpress/element';
import { useSelect, useRegistry } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	REACTION_EMOJIS,
	emojiToHexKey,
	useReactionEmojis,
} from './reaction-emoji-picker';

/**
 * A recorded frequently-used emoji: its normalized hex key and how many
 * times the user has picked it.
 */
export interface FrequentEmojiEntry {
	key: string;
	count: number;
}

/**
 * Preference key (`core` scope) storing frequently used emoji as
 * `{ key, count }` entries, sorted by count with recency breaking ties and
 * capped at `MAX_FREQUENT_EMOJIS`.
 */
export const FREQUENT_EMOJIS_PREFERENCE_KEY = 'emojiPickerFrequentEmojis';

// Four rows of the picker's 8-column grid.
export const MAX_FREQUENT_EMOJIS = 32;

/**
 * Seeds the frequently-used section before any picks. Never persisted:
 * appended at display time, and they fall away as usage fills the list.
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
 * Record one more use of `key`, placing it ahead of entries with the same
 * or a lower count. Over the cap, the least used entry other than the one
 * just recorded is discarded, so a new pick always lands.
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
		// Evict from the tail, skipping the just-recorded key.
		let evictIndex = next.length - 1;
		if ( next[ evictIndex ].key === key ) {
			evictIndex -= 1;
		}
		next.splice( evictIndex, 1 );
	}
	return next;
}

/**
 * Hex keys for the "Frequently used" section: recorded usage first, padded
 * with unrecorded curated defaults, capped at `MAX_FREQUENT_EMOJIS`.
 *
 * @param entries     Stored `{ key, count }` entries.
 * @param defaultKeys Hex keys used to seed the list before usage fills it.
 * @return Ordered hex keys.
 */
export function getFrequentEmojiKeys(
	entries: unknown,
	defaultKeys: string[] = DEFAULT_FREQUENT_EMOJI_KEYS
): string[] {
	const keys = sanitizeEntries( entries ).map( ( entry ) => entry.key );
	const seen = new Set( keys );
	for ( const key of defaultKeys ) {
		if ( ! seen.has( key ) ) {
			keys.push( key );
			seen.add( key );
		}
	}
	return keys.slice( 0, MAX_FREQUENT_EMOJIS );
}

/**
 * The persisted frequently-used list and a `recordUse` callback. Usage is
 * stored per user in the preferences store, so it follows them across
 * sessions and browsers.
 *
 * @return The display-ready hex keys and the usage recorder.
 */
export function useFrequentEmojis(): {
	frequentKeys: string[];
	recordUse: ( key: string ) => void;
} {
	const registry = useRegistry();
	/*
	 * Seed from the filtered list, not the shipped defaults, so a site
	 * using `gutenberg_note_reaction_emojis` sees its own set.
	 */
	const emojis = useReactionEmojis();
	const frequentKeys = useSelect(
		( select ) =>
			getFrequentEmojiKeys(
				select( preferencesStore ).get(
					'core',
					FREQUENT_EMOJIS_PREFERENCE_KEY
				),
				emojis.map( ( entry ) => emojiToHexKey( entry.emoji ) )
			),
		[ emojis ]
	);
	const recordUse = useCallback(
		( key: string ) => {
			// Read at call time so back-to-back picks don't clobber.
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
