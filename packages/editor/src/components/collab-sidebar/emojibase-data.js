/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Emojibase data loading shared between the full emoji picker (lazy
 * loaded) and the reaction pills (eager, label lookups only). This
 * module stays dependency-light so importing it eagerly doesn't pull
 * the picker UI into the main bundle; the heavy part — the per-locale
 * JSON dataset — is only ever fetched on demand.
 */

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
 * @param {string} raw The user-facing locale, e.g. `pt-BR` or `fr_FR`.
 * @return {string} An Emojibase locale key.
 */
export function resolveEmojibaseLocale( raw ) {
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
 * @return {string} A locale key Emojibase ships data for.
 */
export function detectLocale() {
	if ( typeof document !== 'undefined' && document.documentElement?.lang ) {
		return resolveEmojibaseLocale( document.documentElement.lang );
	}
	if ( typeof navigator !== 'undefined' && navigator.language ) {
		return resolveEmojibaseLocale( navigator.language );
	}
	return 'en';
}

// Module-level cache so opening the picker twice doesn't refetch.
const dataCache = new Map();
const inflight = new Map();

/**
 * Fetch and cache Emojibase `data.json` + `messages.json` for a given
 * locale. Resolves with `{ data, messages }` or rejects on a network
 * error so callers can render an error/empty state.
 *
 * @param {string} baseUrl Same-origin base URL for the emojibase-data
 *                         directory (e.g. plugin's
 *                         `build/emojibase-data`).
 * @param {string} locale  Emojibase locale key.
 * @return {Promise<{data: Array, messages: Object}>} Loaded dataset.
 */
export function loadEmojibaseData( baseUrl, locale ) {
	const cacheKey = `${ baseUrl }|${ locale }`;
	if ( dataCache.has( cacheKey ) ) {
		return Promise.resolve( dataCache.get( cacheKey ) );
	}
	if ( inflight.has( cacheKey ) ) {
		return inflight.get( cacheKey );
	}
	const promise = Promise.all( [
		fetch( `${ baseUrl }/${ locale }/data.json` ).then( ( r ) => {
			if ( ! r.ok ) {
				throw new Error( `Failed to load ${ locale }/data.json` );
			}
			return r.json();
		} ),
		fetch( `${ baseUrl }/${ locale }/messages.json` ).then( ( r ) => {
			if ( ! r.ok ) {
				throw new Error( `Failed to load ${ locale }/messages.json` );
			}
			return r.json();
		} ),
	] )
		.then( ( [ data, messages ] ) => {
			const value = { data, messages };
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
 * @param {string} baseUrl Same-origin URL pointing at the emojibase data dir.
 * @param {string} locale  Emojibase locale key.
 * @return {{ data: Array|null, messages: Object|null, isLoading: boolean, error: Error|null }}
 *   Loading state for the dataset.
 */
export function useEmojibaseData( baseUrl, locale ) {
	const [ state, setState ] = useState( () => {
		const cached = dataCache.get( `${ baseUrl }|${ locale }` );
		return {
			data: cached?.data || null,
			messages: cached?.messages || null,
			isLoading: ! cached,
			error: null,
		};
	} );

	useEffect( () => {
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
 * (`2764`), matching `emojiToHexKey()` in `reaction-emoji-picker.js`.
 *
 * @param {string} hexcode Emojibase hexcode.
 * @return {string} Normalized hex key.
 */
function normalizeHexcode( hexcode ) {
	return hexcode
		.split( '-' )
		.filter( ( part ) => part.toLowerCase() !== 'fe0f' )
		.join( '-' )
		.toLowerCase();
}

// One label map per `baseUrl|locale`, built lazily from the dataset.
const labelMapCache = new Map();

/**
 * Build (and cache) a Map from normalized hex key to user-facing emoji
 * label for a loaded dataset, applying any per-site label overrides
 * from `window.gutenbergEmojiLabelOverrides`.
 *
 * @param {string} cacheKey `baseUrl|locale` cache key.
 * @param {Array}  data     Emojibase emoji records.
 * @return {Map} Map from hex key to label.
 */
function buildLabelMap( cacheKey, data ) {
	if ( labelMapCache.has( cacheKey ) ) {
		return labelMapCache.get( cacheKey );
	}
	const overrides =
		typeof window !== 'undefined' && window.gutenbergEmojiLabelOverrides
			? window.gutenbergEmojiLabelOverrides
			: null;
	const map = new Map();
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
 * @param {string} hexKey Normalized reaction hex key, e.g. `1f44d`.
 * @return {string|null} The label, or null when unknown/not loaded.
 */
export function getCachedEmojiLabel( hexKey ) {
	if ( typeof window === 'undefined' || ! window.gutenbergEmojibaseUrl ) {
		return null;
	}
	const cacheKey = `${ window.gutenbergEmojibaseUrl }|${ detectLocale() }`;
	const cached = dataCache.get( cacheKey );
	if ( ! cached ) {
		return null;
	}
	return buildLabelMap( cacheKey, cached.data ).get( hexKey ) || null;
}

/**
 * React hook resolving the user-facing label for a hex-key reaction
 * (a pick from the full emoji picker). Loads the Emojibase dataset on
 * demand — the fetch is shared with the full picker via the module
 * cache — so reaction pill tooltips can show the emoji name just like
 * curated reactions do.
 *
 * @param {string}  hexKey  Normalized reaction hex key, e.g. `1f44d`.
 * @param {boolean} enabled Whether resolution should run (false for
 *                          curated slugs, which have their own labels).
 * @return {string|null} The resolved label, or null while unresolved.
 */
export function useEmojiLabel( hexKey, enabled ) {
	const [ label, setLabel ] = useState( () =>
		enabled ? getCachedEmojiLabel( hexKey ) : null
	);

	useEffect( () => {
		if ( ! enabled || label ) {
			return;
		}
		if ( typeof window === 'undefined' || ! window.gutenbergEmojibaseUrl ) {
			return;
		}
		const baseUrl = window.gutenbergEmojibaseUrl;
		const locale = detectLocale();
		let cancelled = false;
		loadEmojibaseData( baseUrl, locale )
			.then( ( { data } ) => {
				if ( cancelled ) {
					return;
				}
				const resolved = buildLabelMap(
					`${ baseUrl }|${ locale }`,
					data
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
	}, [ hexKey, enabled, label ] );

	return label;
}
