import { useCallback } from '@wordpress/element';
import { useRegistry, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * A recorded frequently used character and how many times it was picked.
 */
export interface FrequentCharacterEntry {
	char: string;
	count: number;
}

/**
 * Preference key, in the `core` scope, storing `{ char, count }` entries
 * sorted by count, with recency breaking ties.
 */
export const FREQUENT_CHARACTERS_PREFERENCE_KEY =
	'specialCharactersFrequentlyUsed';

// Two full rows of the picker's grid.
export const MAX_FREQUENT_CHARACTERS = 16;

/**
 * Seeds the "Frequently used" section before any picks. Never stored: added
 * at display time, and they fall away as real usage fills the list.
 */
export const DEFAULT_FREQUENT_CHARACTERS = [ '—', '–', '©', '™', '€', '°' ];

/**
 * Drops malformed entries from a stored preference value, so a corrupt or
 * outdated value cannot break the picker.
 *
 * @param entries The raw preference value.
 * @return Valid entries.
 */
function sanitizeEntries( entries: unknown ): FrequentCharacterEntry[] {
	if ( ! Array.isArray( entries ) ) {
		return [];
	}
	return entries.filter(
		( entry ): entry is FrequentCharacterEntry =>
			!! entry &&
			typeof entry.char === 'string' &&
			entry.char !== '' &&
			typeof entry.count === 'number' &&
			Number.isFinite( entry.count ) &&
			entry.count > 0
	);
}

/**
 * Records one more use of `char`, placing it ahead of entries with the same
 * or a lower count. Over the cap, the least used entry other than the one
 * just recorded is dropped, so a new pick always lands.
 *
 * @param entries Current entries, as stored.
 * @param char    The picked character.
 * @return The updated entries.
 */
export function recordCharacterUse(
	entries: unknown,
	char: string
): FrequentCharacterEntry[] {
	const list = sanitizeEntries( entries );
	if ( typeof char !== 'string' || char === '' ) {
		return list;
	}
	const count = ( list.find( ( e ) => e.char === char )?.count ?? 0 ) + 1;
	const next = list.filter( ( e ) => e.char !== char );
	const index = next.findIndex( ( e ) => e.count <= count );
	next.splice( index === -1 ? next.length : index, 0, { char, count } );
	while ( next.length > MAX_FREQUENT_CHARACTERS ) {
		let evictIndex = next.length - 1;
		if ( next[ evictIndex ].char === char ) {
			evictIndex -= 1;
		}
		next.splice( evictIndex, 1 );
	}
	return next;
}

/**
 * The characters for the "Frequently used" section: recorded usage first,
 * padded with the defaults, capped at `MAX_FREQUENT_CHARACTERS`. Characters
 * the picker no longer offers are skipped.
 *
 * @param entries  Stored entries.
 * @param isKnown  Whether the picker offers a character.
 * @param defaults Characters that seed the list before usage fills it.
 * @return Ordered characters.
 */
export function getFrequentCharacters(
	entries: unknown,
	isKnown: ( char: string ) => boolean,
	defaults: string[] = DEFAULT_FREQUENT_CHARACTERS
): string[] {
	const chars: string[] = [];
	const seen = new Set< string >();
	for ( const char of [
		...sanitizeEntries( entries ).map( ( entry ) => entry.char ),
		...defaults,
	] ) {
		if ( ! seen.has( char ) && isKnown( char ) ) {
			seen.add( char );
			chars.push( char );
		}
	}
	return chars.slice( 0, MAX_FREQUENT_CHARACTERS );
}

/**
 * The stored usage and a callback to record a pick. Usage is kept per user
 * in the preferences store, so it follows them across sessions and browsers.
 *
 * @return The stored entries and the usage recorder.
 */
export function useFrequentCharacters(): {
	entries: unknown;
	recordUse: ( char: string ) => void;
} {
	const registry = useRegistry();
	const entries = useSelect(
		( select ) =>
			select( preferencesStore ).get(
				'core',
				FREQUENT_CHARACTERS_PREFERENCE_KEY
			),
		[]
	);
	const recordUse = useCallback(
		( char: string ) => {
			// Read at call time, so picks in quick succession don't clobber.
			const current = registry
				.select( preferencesStore )
				.get( 'core', FREQUENT_CHARACTERS_PREFERENCE_KEY );
			registry
				.dispatch( preferencesStore )
				.set(
					'core',
					FREQUENT_CHARACTERS_PREFERENCE_KEY,
					recordCharacterUse( current, char )
				);
		},
		[ registry ]
	);
	return { entries, recordUse };
}
