/**
 * WordPress dependencies
 */
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { Composite, SearchControl } from '@wordpress/components';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { speak } from '@wordpress/a11y';
import { useDebounce } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	detectLocale,
	normalizeHexcode,
	useEmojibaseData,
} from './emojibase-data';
import type { EmojibaseEntry } from './emojibase-data';
import { useFrequentEmojis } from './frequent-emojis';
import SkinTonePicker, { applySkinTone } from './skin-tone-picker';

/**
 * A category bucket of emoji records keyed by its Emojibase `group`.
 */
interface EmojiGroup {
	key: number;
	emojis: EmojibaseEntry[];
}

interface EmojiPickerProps {
	onSelect: ( emoji: string ) => void;
}

/**
 * Preference key (in the `core` scope) storing the user's default emoji
 * skin tone: 0 (default yellow) through 5 (dark), matching Emojibase
 * `tone` values.
 */
export const SKIN_TONE_PREFERENCE_KEY = 'emojiPickerSkinTone';

const COLUMNS = 8;

/**
 * Group emoji records by their Emojibase `group` key, preserving
 * Emojibase's natural ordering (which follows Unicode CLDR). Entries
 * with no `group` (e.g. component code points) are skipped.
 *
 * @param data Emoji records from `data.json`.
 * @return Ordered category buckets.
 */
export function groupEmojis( data: EmojibaseEntry[] ): EmojiGroup[] {
	const buckets = new Map< number, EmojibaseEntry[] >();
	for ( const entry of data ) {
		if ( typeof entry.group !== 'number' ) {
			continue;
		}
		if ( ! buckets.has( entry.group ) ) {
			buckets.set( entry.group, [] );
		}
		buckets.get( entry.group )!.push( entry );
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
 * @param emojis Emoji records.
 * @return Rows of up to `COLUMNS` emoji each.
 */
export function chunkRows( emojis: EmojibaseEntry[] ): EmojibaseEntry[][] {
	const rows: EmojibaseEntry[][] = [];
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
 * @param emojis    Emoji records.
 * @param query     Search query.
 * @param overrides Map of `hexcode => translated label`.
 * @return Matching emoji records.
 */
export function searchEmojis(
	emojis: EmojibaseEntry[],
	query: string,
	overrides: Record< string, string > | null
): EmojibaseEntry[] {
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
 * @param props          Component props.
 * @param props.onSelect Called with the selected emoji character.
 */
export default function EmojiPicker( { onSelect }: EmojiPickerProps ) {
	const baseUrl =
		typeof window !== 'undefined'
			? window.gutenbergEmojibaseUrl ?? null
			: null;
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
	const viewportRef = useRef< HTMLDivElement >( null );
	const searchRef = useRef< HTMLInputElement >( null );

	const { frequentKeys, recordUse } = useFrequentEmojis();
	const skinTone = useSelect(
		( select ) =>
			select( preferencesStore ).get(
				'core',
				SKIN_TONE_PREFERENCE_KEY
			) ?? 0,
		[]
	);
	const { set: setPreference } = useDispatch( preferencesStore );

	// Focus the search field on mount. The picker is swapped into the
	// add-reaction popover when the quick row's `+` option is clicked,
	// and that option unmounts with the quick row — without this the
	// focus would fall back to the document body.
	useEffect( () => {
		searchRef.current?.focus();
	}, [] );

	/**
	 * Resolve the user-facing label for an emoji record. Prefers the
	 * server-supplied override (typically a `__()`-translated string for
	 * locales Emojibase doesn't cover) over the Emojibase data label.
	 *
	 * @param entry Emojibase emoji record.
	 * @return The label to render and use as the accessible name.
	 */
	const labelFor = ( entry: EmojibaseEntry ): string =>
		labelOverrides?.[ entry.hexcode ] || entry.label || '';

	const groups = useMemo(
		() => ( data ? groupEmojis( data ) : [] ),
		[ data ]
	);

	const groupLabelByKey = useMemo( () => {
		const map = new Map< number, string >();
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

	const isSearching = !! query.trim();

	// Search results render as one flat grid: per-category sections would
	// leave sparse, ragged rows (keyboard dead-ends when arrowing across
	// column gaps) and mostly-empty category headers.
	const searchRows = useMemo(
		() =>
			isSearching
				? chunkRows( visibleGroups.flatMap( ( g ) => g.emojis ) )
				: [],
		[ isSearching, visibleGroups ]
	);

	// Index base records by their normalized hex key so the stored
	// frequently-used keys can be resolved back to full emoji records.
	const recordByHexKey = useMemo( () => {
		const map = new Map< string, EmojibaseEntry >();
		for ( const entry of data || [] ) {
			if ( typeof entry.group === 'number' ) {
				map.set( normalizeHexcode( entry.hexcode ), entry );
			}
		}
		return map;
	}, [ data ] );

	// The "Frequently used" section only shows while browsing; during a
	// search it would just duplicate hits from the category results.
	const frequentRows = useMemo( () => {
		if ( query.trim() ) {
			return [];
		}
		return chunkRows(
			frequentKeys
				.map( ( key ) => recordByHexKey.get( key ) )
				.filter( ( entry ): entry is EmojibaseEntry =>
					Boolean( entry )
				)
		);
	}, [ frequentKeys, recordByHexKey, query ] );

	// Announce result counts during search so screen readers stay in sync
	// with the visible grid as the user types. Debounced (matching the
	// block-inserter search pattern) so fast typing announces only the
	// settled result, not every intermediate count.
	const debouncedSpeak = useDebounce( speak, 500 );
	useEffect( () => {
		if ( ! query.trim() || isLoading ) {
			return;
		}
		const message = matchCount
			? sprintf(
					/* translators: %d: number of emojis matching the search. */
					_n( '%d emoji found.', '%d emojis found.', matchCount ),
					matchCount
			  )
			: __( 'No emoji found.' );
		debouncedSpeak( message );
	}, [ query, matchCount, isLoading, debouncedSpeak ] );

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

	/**
	 * Render one grid row of emoji, applying the user's skin tone
	 * preference and recording usage on selection. Shared between the
	 * "Frequently used" section and the category sections.
	 *
	 * @param row    Emoji records for the row.
	 * @param rowKey React key for the row.
	 * @return The rendered row.
	 */
	const renderRow = ( row: EmojibaseEntry[], rowKey: string ) => (
		<Composite.Row
			key={ rowKey }
			role="row"
			className="editor-collab-sidebar-panel__picker-row"
		>
			{ row.map( ( emoji ) => {
				// Swap in the skin-tone variant for display and
				// selection; the base record still drives search
				// matching, usage tracking, and the grid key.
				const display = applySkinTone( emoji, skinTone );
				return (
					<Composite.Item
						key={ emoji.hexcode }
						role="gridcell"
						className="editor-collab-sidebar-panel__picker-emoji"
						aria-label={ labelFor( display ) }
						onClick={ () => {
							recordUse( normalizeHexcode( emoji.hexcode ) );
							onSelect( display.emoji );
						} }
					>
						{ display.emoji }
					</Composite.Item>
				);
			} ) }
		</Composite.Row>
	);

	return (
		<div className="editor-collab-sidebar-panel__picker">
			<div className="editor-collab-sidebar-panel__picker-search">
				<SearchControl
					ref={ searchRef }
					value={ query }
					onChange={ setQuery }
					placeholder={ __( 'Search emoji' ) }
					label={ __( 'Search emoji' ) }
				/>
				<SkinTonePicker
					value={ skinTone }
					onChange={ ( tone ) =>
						setPreference( 'core', SKIN_TONE_PREFERENCE_KEY, tone )
					}
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
						// A trailing partial row is expected (results rarely
						// fill a multiple of 8): shift focus to the nearest
						// cell instead of dead-ending when arrowing down
						// into a missing column.
						focusShift
						className="editor-collab-sidebar-panel__picker-list"
					>
						{ isSearching &&
							searchRows.map( ( row, rowIndex ) =>
								renderRow( row, `search-${ rowIndex }` )
							) }
						{ ! isSearching && frequentRows.length > 0 && (
							<Composite.Group role="rowgroup">
								<Composite.GroupLabel className="editor-collab-sidebar-panel__picker-category">
									{ __( 'Frequently used' ) }
								</Composite.GroupLabel>
								{ frequentRows.map( ( row, rowIndex ) =>
									renderRow( row, `frequent-${ rowIndex }` )
								) }
							</Composite.Group>
						) }
						{ ! isSearching &&
							visibleGroups.map( ( group ) => (
								<Composite.Group
									key={ group.key }
									role="rowgroup"
								>
									<Composite.GroupLabel className="editor-collab-sidebar-panel__picker-category">
										{ groupLabelByKey.get( group.key ) ||
											'' }
									</Composite.GroupLabel>
									{ group.rows.map( ( row, rowIndex ) =>
										renderRow(
											row,
											`${ group.key }-${ rowIndex }`
										)
									) }
								</Composite.Group>
							) ) }
					</Composite>
				) }
			</div>
		</div>
	);
}
