/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Emojibase data loading shared between the full emoji picker (lazy
 * loaded) and the reaction pills (eager, label lookups only). This
 * module stays dependency-light so importing it eagerly doesn't pull
 * the picker UI into the main bundle; the heavy part — the per-locale
 * JSON dataset — is only ever fetched on demand.
 */

/**
 * Emojibase configuration read from the block editor settings.
 */
export interface EmojibaseConfig {
	/**
	 * Same-origin base URL of the Emojibase dataset directory, or null
	 * when the site doesn't provide one (the full picker is unavailable).
	 */
	baseUrl: string | null;
	/**
	 * Per-emoji label overrides keyed by Emojibase hexcode, or null.
	 */
	labelOverrides: Record< string, string > | null;
}

/**
 * Read the Emojibase configuration from the block editor settings. The
 * Gutenberg plugin populates the `noteEmojibaseUrl` and
 * `noteEmojiLabelOverrides` settings server-side (via the
 * `block_editor_settings_all` filter); npm consumers of the editor
 * package opt in by providing the same settings, with the URL pointing
 * at a self-hosted Emojibase dataset.
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
	// A single Fitzpatrick tone, or an array for mixed-tone combinations.
	tone?: number | number[];
}

/**
 * A subset of the Emojibase emoji record shape, covering the fields the
 * picker and reaction pills read.
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
 * A single group heading from the Emojibase `messages.json` dataset.
 */
export interface EmojibaseGroupMessage {
	order: number;
	message: string;
}

/**
 * The subset of the Emojibase `messages.json` dataset the picker reads.
 */
export interface EmojibaseMessages {
	groups?: EmojibaseGroupMessage[];
}

/**
 * A loaded Emojibase dataset for a single locale.
 */
export interface EmojibaseDataset {
	data: EmojibaseEntry[];
	messages: EmojibaseMessages;
}

/**
 * Loading state for a requested Emojibase dataset.
 */
export interface EmojibaseDataState {
	data: EmojibaseEntry[] | null;
	messages: EmojibaseMessages | null;
	isLoading: boolean;
	error: Error | null;
}

/**
 * Locales for which Emojibase ships translated labels and tags. Built
 * from the directory listing of the `emojibase-data` npm package, kept
 * in sync with the `LOCALES` set copied by
 * `tools/build-scripts/copy-emojibase-data.mjs`.
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
	// Special-case Traditional Chinese variants. Must run before the
	// language-portion fallback, since `zh` is itself a supported locale
	// and would otherwise swallow `zh-tw`/`zh-hk`/`zh-mo`.
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
 * Fetch and cache Emojibase `data.json` + `messages.json` for a given
 * locale. Resolves with `{ data, messages }` or rejects on a network
 * error so callers can render an error/empty state.
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
	const promise = Promise.all( [
		fetch( `${ baseUrl }/${ locale }/data.json` ).then( ( r ) => {
			if ( ! r.ok ) {
				throw new Error( `Failed to load ${ locale }/data.json` );
			}
			return r.json() as Promise< EmojibaseEntry[] >;
		} ),
		fetch( `${ baseUrl }/${ locale }/messages.json` ).then( ( r ) => {
			if ( ! r.ok ) {
				throw new Error( `Failed to load ${ locale }/messages.json` );
			}
			return r.json() as Promise< EmojibaseMessages >;
		} ),
	] )
		.then( ( [ data, messages ] ) => {
			const value: EmojibaseDataset = { data, messages };
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
			messages: cached?.messages || null,
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
				messages: cached.messages,
				isLoading: false,
				error: null,
			} );
			return;
		}
		setState( ( prev ) => ( { ...prev, isLoading: true, error: null } ) );
		loadEmojibaseData( baseUrl, locale )
			.then( ( { data, messages } ) => {
				if ( cancelled ) {
					return;
				}
				setState( {
					data,
					messages,
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
					messages: null,
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
 * Normalize an Emojibase hexcode (`2764-FE0F`) to the reaction storage
 * key form: lowercase with variation selector U+FE0F segments removed
 * (`2764`), matching `emojiToHexKey()` in `reaction-emoji-picker.tsx`.
 *
 * @param hexcode Emojibase hexcode.
 * @return Normalized hex key.
 */
export function normalizeHexcode( hexcode: string ): string {
	return hexcode
		.split( '-' )
		.filter( ( part ) => part.toLowerCase() !== 'fe0f' )
		.join( '-' )
		.toLowerCase();
}

// One label map per `baseUrl|locale`, built lazily from the dataset.
const labelMapCache = new Map< string, Map< string, string > >();

/**
 * Build (and cache) a Map from normalized hex key to user-facing emoji
 * label for a loaded dataset, applying any per-site label overrides.
 * The overrides are page-static (they come from the editor settings),
 * so the cache is keyed by dataset alone.
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
	for ( const entry of data ) {
		if ( ! entry.hexcode || ! entry.label ) {
			continue;
		}
		map.set(
			normalizeHexcode( entry.hexcode ),
			overrides?.[ entry.hexcode ] || entry.label
		);
		// Skin-tone variants are stored under their own hex keys when
		// picked with a non-default skin tone preference, so index them
		// too for reaction pill tooltips.
		if ( Array.isArray( entry.skins ) ) {
			for ( const skin of entry.skins ) {
				if ( skin.hexcode && skin.label ) {
					map.set(
						normalizeHexcode( skin.hexcode ),
						overrides?.[ skin.hexcode ] || skin.label
					);
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
 * React hook resolving the user-facing label for a hex-key reaction
 * (a pick from the full emoji picker). Loads the Emojibase dataset on
 * demand — the fetch is shared with the full picker via the module
 * cache — so reaction pill tooltips can show the emoji name just like
 * curated reactions do.
 *
 * @param hexKey  Normalized reaction hex key, e.g. `1f44d`.
 * @param enabled Whether resolution should run (false for curated
 *                slugs, which have their own labels).
 * @return The resolved label, or null while unresolved.
 */
export function useEmojiLabel(
	hexKey: string,
	enabled: boolean
): string | null {
	const { baseUrl, labelOverrides } = useEmojibaseConfig();
	const [ label, setLabel ] = useState< string | null >( () =>
		enabled ? getCachedEmojiLabel( hexKey, baseUrl, labelOverrides ) : null
	);

	useEffect( () => {
		if ( ! enabled || label || ! baseUrl ) {
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
	}, [ hexKey, enabled, label, baseUrl, labelOverrides ] );

	return label;
}
