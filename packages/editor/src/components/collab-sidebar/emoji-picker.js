/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Composite, SearchControl } from '@wordpress/components';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { speak } from '@wordpress/a11y';

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
function detectLocale() {
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
function loadEmojibaseData( baseUrl, locale ) {
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
function useEmojibaseData( baseUrl, locale ) {
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

const COLUMNS = 8;

/**
 * Group emoji records by their Emojibase `group` key, preserving
 * Emojibase's natural ordering (which follows Unicode CLDR). Entries
 * with no `group` (e.g. component code points) are skipped.
 *
 * @param {Array} data Emoji records from `data.json`.
 * @return {Array<{ key: number, emojis: Array }>} Ordered category buckets.
 */
export function groupEmojis( data ) {
	const buckets = new Map();
	for ( const entry of data ) {
		if ( typeof entry.group !== 'number' ) {
			continue;
		}
		if ( ! buckets.has( entry.group ) ) {
			buckets.set( entry.group, [] );
		}
		buckets.get( entry.group ).push( entry );
	}
	return Array.from( buckets.entries() )
		.sort( ( a, b ) => a[ 0 ] - b[ 0 ] )
		.map( ( [ key, emojis ] ) => ( { key, emojis } ) );
}

/**
 * Slice a flat list of emoji into rows of `COLUMNS` items so the grid
 * keeps a stable column count even as the visible list shrinks during
 * search.
 *
 * @param {Array} emojis Emoji records.
 * @return {Array<Array>} Rows of up to `COLUMNS` emoji each.
 */
export function chunkRows( emojis ) {
	const rows = [];
	for ( let i = 0; i < emojis.length; i += COLUMNS ) {
		rows.push( emojis.slice( i, i + COLUMNS ) );
	}
	return rows;
}

/**
 * Run a case-insensitive search over the emoji label and Emojibase
 * tags, applying any per-emoji label override before matching so users
 * searching for an overridden label still get the expected hit.
 * Returns the unfiltered list when the query is empty.
 *
 * @param {Array}       emojis    Emoji records.
 * @param {string}      query     Search query.
 * @param {Object|null} overrides Map of `hexcode => translated label`.
 * @return {Array} Matching emoji records.
 */
export function searchEmojis( emojis, query, overrides ) {
	const trimmed = query.trim().toLowerCase();
	if ( ! trimmed ) {
		return emojis;
	}
	return emojis.filter( ( entry ) => {
		// Match against both the overridden label (if any) and the
		// original Emojibase label so a user searching in either name
		// still finds the emoji — useful when an English-language user
		// types "red heart" against a "Heart" override, or a translator
		// types the local-language label against the English fallback.
		const override = overrides?.[ entry.hexcode ];
		if ( override && override.toLowerCase().includes( trimmed ) ) {
			return true;
		}
		if ( entry.label && entry.label.toLowerCase().includes( trimmed ) ) {
			return true;
		}
		if ( Array.isArray( entry.tags ) ) {
			for ( const tag of entry.tags ) {
				if ( tag.toLowerCase().includes( trimmed ) ) {
					return true;
				}
			}
		}
		return false;
	} );
}

/**
 * Full searchable emoji picker built from WPDS components
 * (`SearchControl`, `Composite`) and styled with WPDS tokens. Emoji
 * data and labels come from Emojibase per-locale files served
 * same-origin from `window.gutenbergEmojibaseUrl`; UI chrome strings
 * go through `@wordpress/i18n` so GlotPress can translate them.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onSelect Called with the selected emoji character.
 */
export default function EmojiPicker( { onSelect } ) {
	const baseUrl =
		typeof window !== 'undefined' ? window.gutenbergEmojibaseUrl : null;
	const labelOverrides =
		typeof window !== 'undefined' && window.gutenbergEmojiLabelOverrides
			? window.gutenbergEmojiLabelOverrides
			: null;
	const [ locale ] = useState( detectLocale );
	const { data, messages, isLoading, error } = useEmojibaseData(
		baseUrl,
		locale
	);
	const [ query, setQuery ] = useState( '' );
	const viewportRef = useRef( null );

	/**
	 * Resolve the user-facing label for an emoji record. Prefers the
	 * server-supplied override (typically a `__()`-translated string for
	 * locales Emojibase doesn't cover) over the Emojibase data label.
	 *
	 * @param {Object} entry Emojibase emoji record.
	 * @return {string} The label to render and use as the accessible name.
	 */
	const labelFor = ( entry ) =>
		labelOverrides?.[ entry.hexcode ] || entry.label || '';

	const groups = useMemo(
		() => ( data ? groupEmojis( data ) : [] ),
		[ data ]
	);

	const groupLabelByKey = useMemo( () => {
		const map = new Map();
		if ( messages?.groups ) {
			for ( const g of messages.groups ) {
				map.set( g.order, g.message );
			}
		}
		return map;
	}, [ messages ] );

	const visibleGroups = useMemo( () => {
		if ( ! groups.length ) {
			return [];
		}
		if ( ! query.trim() ) {
			return groups.map( ( g ) => ( {
				...g,
				rows: chunkRows( g.emojis ),
			} ) );
		}
		return groups
			.map( ( g ) => {
				const filtered = searchEmojis(
					g.emojis,
					query,
					labelOverrides
				);
				return {
					...g,
					emojis: filtered,
					rows: chunkRows( filtered ),
				};
			} )
			.filter( ( g ) => g.emojis.length > 0 );
	}, [ groups, query, labelOverrides ] );

	const matchCount = useMemo(
		() => visibleGroups.reduce( ( n, g ) => n + g.emojis.length, 0 ),
		[ visibleGroups ]
	);

	// Announce result counts during search so screen readers stay in sync
	// with the visible grid as the user types.
	useEffect( () => {
		if ( ! query.trim() || isLoading ) {
			return;
		}
		if ( matchCount === 0 ) {
			speak( __( 'No emoji found.' ) );
		}
	}, [ query, matchCount, isLoading ] );

	// Reset scroll position when the search query changes so the user
	// always sees the top match instead of a stale scroll offset.
	useEffect( () => {
		if ( viewportRef.current ) {
			viewportRef.current.scrollTop = 0;
		}
	}, [ query ] );

	if ( ! baseUrl ) {
		return null;
	}

	return (
		<div className="editor-collab-sidebar-panel__picker">
			<div className="editor-collab-sidebar-panel__picker-search">
				<SearchControl
					value={ query }
					onChange={ setQuery }
					placeholder={ __( 'Search emoji' ) }
					label={ __( 'Search emoji' ) }
				/>
			</div>
			<div
				ref={ viewportRef }
				className="editor-collab-sidebar-panel__picker-viewport"
			>
				{ isLoading && (
					<div
						className="editor-collab-sidebar-panel__picker-status"
						role="status"
					>
						{ __( 'Loading…' ) }
					</div>
				) }
				{ error && ! isLoading && (
					<div
						className="editor-collab-sidebar-panel__picker-status"
						role="alert"
					>
						{ __( 'Couldn’t load emojis.' ) }
					</div>
				) }
				{ ! isLoading && ! error && matchCount === 0 && (
					<div
						className="editor-collab-sidebar-panel__picker-status"
						role="status"
					>
						{ __( 'No emoji found.' ) }
					</div>
				) }
				{ ! isLoading && ! error && matchCount > 0 && (
					<Composite
						role="grid"
						aria-label={ _x( 'Emoji', 'emoji picker grid label' ) }
						className="editor-collab-sidebar-panel__picker-list"
					>
						{ visibleGroups.map( ( group ) => (
							<div key={ group.key }>
								<div
									className="editor-collab-sidebar-panel__picker-category"
									role="presentation"
								>
									{ groupLabelByKey.get( group.key ) || '' }
								</div>
								{ group.rows.map( ( row, rowIndex ) => (
									<Composite.Row
										key={ `${ group.key }-${ rowIndex }` }
										role="row"
										className="editor-collab-sidebar-panel__picker-row"
									>
										{ row.map( ( emoji ) => (
											<Composite.Item
												key={ emoji.hexcode }
												role="gridcell"
												className="editor-collab-sidebar-panel__picker-emoji"
												aria-label={ labelFor( emoji ) }
												onClick={ () =>
													onSelect( emoji.emoji )
												}
											>
												{ emoji.emoji }
											</Composite.Item>
										) ) }
									</Composite.Row>
								) ) }
							</div>
						) ) }
					</Composite>
				) }
			</div>
		</div>
	);
}
