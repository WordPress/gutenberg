import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
import { store as blockEditorStore } from '@wordpress/block-editor';

/*
 * Emojibase loading shared by the full picker (lazy) and the reaction
 * pills (eager, labels only). Kept dependency-light so importing it does
 * not pull the picker UI into the main bundle.
 */

/**
 * Emojibase configuration read from the block editor settings.
 */
export interface EmojibaseConfig {
	// Null when the site serves no dataset, which hides the full picker.
	baseUrl: string | null;
	labelOverrides: Record< string, string > | null;
}

/**
 * Read the Emojibase configuration from the block editor settings. The
 * plugin sets these server-side; npm consumers supply them themselves.
 *
 * @return The Emojibase base URL and label overrides.
 */
export function useEmojibaseConfig(): EmojibaseConfig {
	return useSelect( ( select ) => {
		const settings: Record< string, unknown > =
			select( blockEditorStore ).getSettings();
		const baseUrl = settings.noteEmojibaseUrl;
		const labelOverrides = settings.noteEmojiLabelOverrides;
		return {
			baseUrl: typeof baseUrl === 'string' && baseUrl ? baseUrl : null,
			labelOverrides:
				labelOverrides && typeof labelOverrides === 'object'
					? ( labelOverrides as Record< string, string > )
					: null,
		};
	}, [] );
}

/**
 * A single skin-tone variant of an Emojibase emoji record.
 */
export interface EmojibaseSkin {
	hexcode: string;
	emoji: string;
	label?: string;
	// One Fitzpatrick tone, or an array for mixed-tone combinations.
	tone?: number | number[];
}

/**
 * The subset of an Emojibase record the picker and pills read.
 */
export interface EmojibaseEntry {
	hexcode: string;
	emoji: string;
	label?: string;
	tags?: string[];
	group?: number;
	order?: number;
	skins?: EmojibaseSkin[];
}

/**
 * A loaded Emojibase dataset for a single locale.
 */
export interface EmojibaseDataset {
	data: EmojibaseEntry[];
}

/**
 * Loading state for a requested Emojibase dataset.
 */
export interface EmojibaseDataState {
	data: EmojibaseEntry[] | null;
	isLoading: boolean;
	error: Error | null;
}

/*
 * Locales Emojibase ships translated labels for. Must stay in sync with
 * `LOCALES` in `tools/build-scripts/copy-emojibase-data.mjs`.
 */
export const EMOJIBASE_LOCALES = new Set( [
	'bn',
	'da',
	'de',
	'en',
	'en-gb',
	'es',
	'es-mx',
	'et',
	'fi',
	'fr',
	'hi',
	'hu',
	'it',
	'ja',
	'ko',
	'lt',
	'ms',
	'nb',
	'nl',
	'pl',
	'pt',
	'ru',
	'sv',
	'th',
	'uk',
	'vi',
	'zh',
	'zh-hant',
] );

/**
 * Map a BCP-47 / WordPress locale string to the closest Emojibase locale,
 * falling back to English. Tries the full tag (e.g. `pt-br`) first, then
 * the language portion (`pt`), then `en`.
 *
 * @param raw The user-facing locale, e.g. `pt-BR` or `fr_FR`.
 * @return An Emojibase locale key.
 */
export function resolveEmojibaseLocale( raw: string ): string {
	if ( typeof raw !== 'string' || ! raw ) {
		return 'en';
	}
	const normalized = raw.toLowerCase().replace( '_', '-' );
	if ( EMOJIBASE_LOCALES.has( normalized ) ) {
		return normalized;
	}
	/*
	 * Must precede the language-portion fallback: `zh` is itself a
	 * supported locale and would otherwise swallow these.
	 */
	if ( [ 'zh-tw', 'zh-hk', 'zh-mo' ].includes( normalized ) ) {
		return 'zh-hant';
	}
	const lang = normalized.split( '-' )[ 0 ];
	if ( EMOJIBASE_LOCALES.has( lang ) ) {
		return lang;
	}
	return 'en';
}

/**
 * Detect the active locale for the picker. Prefers `<html lang>` (set by
 * WordPress to the site language) and falls back to `navigator.language`.
 *
 * @return A locale key Emojibase ships data for.
 */
export function detectLocale(): string {
	if ( typeof document !== 'undefined' && document.documentElement?.lang ) {
		return resolveEmojibaseLocale( document.documentElement.lang );
	}
	if ( typeof navigator !== 'undefined' && navigator.language ) {
		return resolveEmojibaseLocale( navigator.language );
	}
	return 'en';
}

// Module-level cache so opening the picker twice doesn't refetch.
const dataCache = new Map< string, EmojibaseDataset >();
const inflight = new Map< string, Promise< EmojibaseDataset > >();

/**
 * Fetch and cache the Emojibase `data.json` for a given locale. Resolves
 * with `{ data }` or rejects on a network error so callers can render an
 * error/empty state. Category headings come from Unicode's own group
 * names in the picker, so `messages.json` is never fetched.
 *
 * @param baseUrl Same-origin base URL for the emojibase-data
 *                directory (e.g. plugin's `build/emojibase-data`).
 * @param locale  Emojibase locale key.
 * @return Loaded dataset.
 */
export function loadEmojibaseData(
	baseUrl: string,
	locale: string
): Promise< EmojibaseDataset > {
	const cacheKey = `${ baseUrl }|${ locale }`;
	if ( dataCache.has( cacheKey ) ) {
		return Promise.resolve( dataCache.get( cacheKey ) as EmojibaseDataset );
	}
	if ( inflight.has( cacheKey ) ) {
		return inflight.get( cacheKey ) as Promise< EmojibaseDataset >;
	}
	const promise = fetch( `${ baseUrl }/${ locale }/data.json` )
		.then( ( r ) => {
			if ( ! r.ok ) {
				throw new Error( `Failed to load ${ locale }/data.json` );
			}
			return r.json() as Promise< EmojibaseEntry[] >;
		} )
		.then( ( data ) => {
			const value: EmojibaseDataset = { data };
			dataCache.set( cacheKey, value );
			inflight.delete( cacheKey );
			return value;
		} )
		.catch( ( error ) => {
			inflight.delete( cacheKey );
			throw error;
		} );
	inflight.set( cacheKey, promise );
	return promise;
}

/**
 * React hook that fetches Emojibase data for a given base URL and locale.
 *
 * @param baseUrl Same-origin URL pointing at the emojibase data dir.
 * @param locale  Emojibase locale key.
 * @return Loading state for the dataset.
 */
export function useEmojibaseData(
	baseUrl: string | null,
	locale: string
): EmojibaseDataState {
	const [ state, setState ] = useState< EmojibaseDataState >( () => {
		const cached = dataCache.get( `${ baseUrl }|${ locale }` );
		return {
			data: cached?.data || null,
			isLoading: ! cached,
			error: null,
		};
	} );

	useEffect( () => {
		if ( ! baseUrl ) {
			return;
		}
		let cancelled = false;
		const cached = dataCache.get( `${ baseUrl }|${ locale }` );
		if ( cached ) {
			setState( {
				data: cached.data,
				isLoading: false,
				error: null,
			} );
			return;
		}
		setState( ( prev ) => ( { ...prev, isLoading: true, error: null } ) );
		loadEmojibaseData( baseUrl, locale )
			.then( ( { data } ) => {
				if ( cancelled ) {
					return;
				}
				setState( {
					data,
					isLoading: false,
					error: null,
				} );
			} )
			.catch( ( error ) => {
				if ( cancelled ) {
					return;
				}
				setState( {
					data: null,
					isLoading: false,
					error,
				} );
			} );
		return () => {
			cancelled = true;
		};
	}, [ baseUrl, locale ] );

	return state;
}

/**
 * Normalize an Emojibase hexcode (`2764-FE0F`) to the reaction storage key
 * form: lowercase, four-digit padded, U+FE0F stripped (`2764`). Must agree
 * with `emojiToHexKey()` in `reaction-emoji-picker.tsx`.
 *
 * @param hexcode Emojibase hexcode.
 * @return Normalized hex key.
 */
export function normalizeHexcode( hexcode: string ): string {
	return hexcode
		.toLowerCase()
		.split( '-' )
		.filter( ( part ) => part !== 'fe0f' )
		.map( ( part ) => part.padStart( 4, '0' ) )
		.join( '-' );
}

// One label map per `baseUrl|locale`, built lazily from the dataset.
const labelMapCache = new Map< string, Map< string, string > >();

/**
 * Look up a site's label override for an Emojibase entry.
 *
 * Emojibase hexcodes may keep U+FE0F (`2764-FE0F-200D-1F525`) while the
 * server writes keys normalized without it, so try the raw hexcode first
 * and the normalized form second.
 *
 * @param overrides Map of `hexcode => translated label`, or null.
 * @param hexcode   The entry's Emojibase hexcode.
 * @return The override label, or undefined when there is none.
 */
export function getOverrideLabel(
	overrides: Record< string, string > | null,
	hexcode: string
): string | undefined {
	if ( ! overrides ) {
		return undefined;
	}
	return (
		overrides[ hexcode ] ??
		overrides[ normalizeHexcode( hexcode ).toUpperCase() ]
	);
}

/**
 * Build (and cache) a normalized-hex-key to label Map for a dataset,
 * applying per-site overrides. Overrides come from editor settings and are
 * page-static, so the cache is keyed by dataset alone.
 *
 * @param cacheKey  `baseUrl|locale` cache key.
 * @param data      Emojibase emoji records.
 * @param overrides Map of `hexcode => translated label`, or null.
 * @return Map from hex key to label.
 */
function buildLabelMap(
	cacheKey: string,
	data: EmojibaseEntry[],
	overrides: Record< string, string > | null
): Map< string, string > {
	const existing = labelMapCache.get( cacheKey );
	if ( existing ) {
		return existing;
	}
	const map = new Map< string, string >();
	const indexEntry = ( hexcode: string, label: string ) => {
		map.set(
			normalizeHexcode( hexcode ),
			getOverrideLabel( overrides, hexcode ) || label
		);
	};
	for ( const entry of data ) {
		if ( ! entry.hexcode || ! entry.label ) {
			continue;
		}
		indexEntry( entry.hexcode, entry.label );
		// Non-default skin tones are stored under their own hex keys.
		if ( Array.isArray( entry.skins ) ) {
			for ( const skin of entry.skins ) {
				if ( skin.hexcode && skin.label ) {
					indexEntry( skin.hexcode, skin.label );
				}
			}
		}
	}
	labelMapCache.set( cacheKey, map );
	return map;
}

/**
 * Look up the label for a stored hex-key reaction from the already
 * loaded dataset, without triggering a fetch.
 *
 * @param hexKey    Normalized reaction hex key, e.g. `1f44d`.
 * @param baseUrl   Same-origin URL of the Emojibase dataset directory.
 * @param overrides Map of `hexcode => translated label`, or null.
 * @return The label, or null when unknown/not loaded.
 */
export function getCachedEmojiLabel(
	hexKey: string,
	baseUrl: string | null,
	overrides: Record< string, string > | null
): string | null {
	if ( ! baseUrl ) {
		return null;
	}
	const cacheKey = `${ baseUrl }|${ detectLocale() }`;
	const cached = dataCache.get( cacheKey );
	if ( ! cached ) {
		return null;
	}
	return (
		buildLabelMap( cacheKey, cached.data, overrides ).get( hexKey ) || null
	);
}

/**
 * Resolve the label for a hex-key reaction so its pill tooltip reads like a
 * curated one. A loaded dataset resolves from the module cache; otherwise
 * the fetch waits for `load`, since the dataset is ~775KB and should not be
 * pulled just because a note carries a full-picker reaction. Until then the
 * emoji character stands in, which assistive technology announces by its
 * Unicode name.
 *
 * @param hexKey  Normalized reaction hex key, e.g. `1f44d`.
 * @param enabled Whether resolution should run (false for curated
 *                slugs, which have their own labels).
 * @param load    Whether to fetch the dataset when it isn't cached.
 * @return The resolved label, or null while unresolved.
 */
export function useEmojiLabel(
	hexKey: string,
	enabled: boolean,
	load: boolean
): string | null {
	const { baseUrl, labelOverrides } = useEmojibaseConfig();
	const [ label, setLabel ] = useState< string | null >( () =>
		enabled ? getCachedEmojiLabel( hexKey, baseUrl, labelOverrides ) : null
	);

	useEffect( () => {
		if ( ! enabled || ! load || label || ! baseUrl ) {
			return;
		}
		const locale = detectLocale();
		let cancelled = false;
		loadEmojibaseData( baseUrl, locale )
			.then( ( { data } ) => {
				if ( cancelled ) {
					return;
				}
				const resolved = buildLabelMap(
					`${ baseUrl }|${ locale }`,
					data,
					labelOverrides
				).get( hexKey );
				if ( resolved ) {
					setLabel( resolved );
				}
			} )
			.catch( () => {
				// Leave the emoji character as the fallback label.
			} );
		return () => {
			cancelled = true;
		};
	}, [ hexKey, enabled, load, label, baseUrl, labelOverrides ] );

	return label;
}
