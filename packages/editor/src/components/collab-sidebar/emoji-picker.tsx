import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { Autocomplete, Icon, Input, InputLayout } from '@wordpress/ui';
import { search } from '@wordpress/icons';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { speak } from '@wordpress/a11y';
import { useDebounce } from '@wordpress/compose';
import {
	detectLocale,
	getOverrideLabel,
	normalizeHexcode,
	useEmojibaseConfig,
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
	onError?: () => void;
}

/**
 * Preference key (in the `core` scope) storing the user's default emoji
 * skin tone: 0 (default yellow) through 5 (dark), matching Emojibase
 * `tone` values.
 */
export const SKIN_TONE_PREFERENCE_KEY = 'emojiPickerSkinTone';

const COLUMNS = 6;

/*
 * Unicode's Component group holds the skin-tone swatches and hair
 * modifiers, which only ever combine with another emoji. They are not
 * pickable on their own, so the group is dropped rather than shown as a
 * row of bare swatches.
 */
const COMPONENT_GROUP = 2;

/**
 * Unicode's own name for an emoji group, taken verbatim from the
 * `# group:` lines of `emoji-test.txt`. Emojibase indexes the same groups
 * by `group` / `order` but ships its English names lowercased and
 * pluralized ("smileys & emotion", "components"), and cases the other
 * locales inconsistently, so the headings are translated here rather than
 * read from its `messages.json`.
 *
 * Resolved per render so the strings are looked up after the editor's
 * translations have loaded.
 *
 * @param key Emojibase `group` key.
 * @return The category heading, or an empty string for an unknown group.
 */
export function getGroupLabel( key: number ): string {
	switch ( key ) {
		case 0:
			return __( 'Smileys & Emotion' );
		case 1:
			return __( 'People & Body' );
		case 3:
			return __( 'Animals & Nature' );
		case 4:
			return __( 'Food & Drink' );
		case 5:
			return __( 'Travel & Places' );
		case 6:
			return __( 'Activities' );
		case 7:
			return __( 'Objects' );
		case 8:
			return __( 'Symbols' );
		case 9:
			return __( 'Flags' );
		default:
			return '';
	}
}

/**
 * Group emoji records by their Emojibase `group` key, preserving
 * Emojibase's natural ordering (which follows Unicode). Entries with no
 * `group`, and the Component group, are skipped.
 *
 * @param data Emoji records from `data.json`.
 * @return Ordered category buckets.
 */
export function groupEmojis( data: EmojibaseEntry[] ): EmojiGroup[] {
	const buckets = new Map< number, EmojibaseEntry[] >();
	for ( const entry of data ) {
		if (
			typeof entry.group !== 'number' ||
			entry.group === COMPONENT_GROUP
		) {
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
 * Case-insensitive search over emoji labels and Emojibase tags. Returns
 * the unfiltered list when the query is empty.
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
		/*
		 * Match both the override and the original Emojibase label, so
		 * searching either name finds the emoji.
		 */
		const override = getOverrideLabel( overrides, entry.hexcode );
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
 * Full searchable emoji picker. Emoji data and labels come from the
 * per-locale Emojibase files at `noteEmojibaseUrl`; UI chrome strings go
 * through `@wordpress/i18n`.
 *
 * @param props          Component props.
 * @param props.onSelect Called with the selected emoji character.
 * @param props.onError  Called when the Emojibase dataset fails to load,
 *                       so the parent can swap in a fallback picker.
 */
export default function EmojiPicker( { onSelect, onError }: EmojiPickerProps ) {
	const { baseUrl, labelOverrides } = useEmojibaseConfig();
	const [ locale ] = useState( detectLocale );
	const { data, isLoading, error } = useEmojibaseData( baseUrl, locale );
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

	/*
	 * The popover runs its focus-on-mount pass before the lazy chunk and
	 * dataset resolve, so focus would otherwise stay on the loading state.
	 */
	useEffect( () => {
		searchRef.current?.focus();
	}, [] );

	/**
	 * Resolve an emoji's label, preferring the server-supplied override
	 * over the Emojibase one.
	 *
	 * @param entry Emojibase emoji record.
	 * @return The label to render and use as the accessible name.
	 */
	const labelFor = ( entry: EmojibaseEntry ): string =>
		getOverrideLabel( labelOverrides, entry.hexcode ) || entry.label || '';

	const groups = useMemo(
		() => ( data ? groupEmojis( data ) : [] ),
		[ data ]
	);

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

	/*
	 * One flat grid of results, as in the macOS picker: per-category
	 * sections would scatter a few hits under mostly-empty headers.
	 */
	const searchRows = useMemo(
		() =>
			isSearching
				? chunkRows( visibleGroups.flatMap( ( g ) => g.emojis ) )
				: [],
		[ isSearching, visibleGroups ]
	);

	// Resolves stored frequently-used hex keys back to full records.
	const recordByHexKey = useMemo( () => {
		const map = new Map< string, EmojibaseEntry >();
		for ( const entry of data || [] ) {
			if ( typeof entry.group === 'number' ) {
				map.set( normalizeHexcode( entry.hexcode ), entry );
			}
		}
		return map;
	}, [ data ] );

	// Hidden during search, where it would duplicate the category hits.
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

	/*
	 * Announced via the `@wordpress/a11y` announcer, whose live regions
	 * already exist: a live region mounted together with its content is
	 * not reliably announced. Hence no live-region roles below either.
	 */
	useEffect( () => {
		if ( isLoading ) {
			speak( __( 'Loading…' ) );
		}
	}, [ isLoading ] );

	// The parent swaps in the curated picker so reacting keeps working.
	useEffect( () => {
		if ( error ) {
			onError?.();
		}
	}, [ error, onError ] );

	/*
	 * Debounced, as in the block inserter, so fast typing announces the
	 * settled result rather than every intermediate count.
	 */
	const debouncedSpeak = useDebounce( speak, 500 );
	useEffect( () => {
		if ( ! query.trim() || isLoading ) {
			/*
			 * Drop a count queued from the previous query: clearing the
			 * field restores the full grid, so it no longer applies.
			 */
			debouncedSpeak.cancel();
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

	// Show the top match rather than a stale scroll offset.
	useEffect( () => {
		if ( viewportRef.current ) {
			viewportRef.current.scrollTop = 0;
		}
	}, [ query ] );

	if ( ! baseUrl ) {
		return null;
	}

	/**
	 * Render one grid row, applying the user's skin tone preference and
	 * recording usage on selection.
	 *
	 * @param row    Emoji records for the row.
	 * @param rowKey React key for the row.
	 * @return The rendered row.
	 */
	const renderRow = ( row: EmojibaseEntry[], rowKey: string ) => (
		<Autocomplete.Row
			key={ rowKey }
			className="editor-collab-sidebar-panel__picker-row"
		>
			{ row.map( ( emoji ) => {
				/*
				 * The variant is shown and selected; the base record
				 * still drives search, usage, and the grid key.
				 */
				const display = applySkinTone( emoji, skinTone );
				return (
					<Autocomplete.Item
						key={ emoji.hexcode }
						value={ display.emoji }
						className="editor-collab-sidebar-panel__picker-emoji"
						aria-label={ labelFor( display ) }
						// Enter on the highlighted cell clicks it too.
						onClick={ () => {
							recordUse( normalizeHexcode( emoji.hexcode ) );
							onSelect( display.emoji );
						} }
					>
						{ display.emoji }
					</Autocomplete.Item>
				);
			} ) }
		</Autocomplete.Row>
	);

	return (
		<div className="editor-collab-sidebar-panel__picker">
			{ /*
			 * An always-open inline autocomplete: focus stays in the search
			 * field while the arrow keys move a highlight through the grid
			 * (`aria-activedescendant`), and Enter picks the highlighted
			 * emoji. Filtering stays ours (`mode="none"`), since it matches
			 * label overrides and Emojibase tags.
			 */ }
			<Autocomplete.Root
				inline
				open
				grid
				mode="none"
				// Enter picks the top hit once the user has typed.
				autoHighlight
				value={ query }
				onValueChange={ ( value, { reason } ) => {
					// Picking a cell would otherwise copy the emoji into the field.
					if ( reason !== 'item-press' ) {
						setQuery( value );
					}
				} }
			>
				<div className="editor-collab-sidebar-panel__picker-search">
					<Autocomplete.InputGroup className="editor-collab-sidebar-panel__picker-input">
						<Autocomplete.Input
							ref={ searchRef }
							aria-label={ __( 'Search emoji' ) }
							placeholder={ __( 'Search emoji' ) }
							render={
								<Input
									prefix={
										<InputLayout.Slot padding="minimal">
											<Icon icon={ search } />
										</InputLayout.Slot>
									}
									suffix={
										isSearching ? (
											<InputLayout.Slot padding="minimal">
												<Autocomplete.Clear
													aria-label={ __(
														'Reset search'
													) }
												/>
											</InputLayout.Slot>
										) : undefined
									}
								/>
							}
						/>
					</Autocomplete.InputGroup>
					<SkinTonePicker
						value={ skinTone }
						onChange={ ( tone ) =>
							setPreference(
								'core',
								SKIN_TONE_PREFERENCE_KEY,
								tone
							)
						}
					/>
				</div>
				<div
					ref={ viewportRef }
					className="editor-collab-sidebar-panel__picker-viewport"
				>
					{ isLoading && (
						<div className="editor-collab-sidebar-panel__picker-status">
							{ __( 'Loading…' ) }
						</div>
					) }
					{ error && ! isLoading && (
						<div className="editor-collab-sidebar-panel__picker-status">
							{ __( 'Couldn’t load emojis.' ) }
						</div>
					) }
					{ ! isLoading && ! error && matchCount === 0 && (
						<div className="editor-collab-sidebar-panel__picker-status">
							{ __( 'No emoji found.' ) }
						</div>
					) }
					{ ! isLoading && ! error && matchCount > 0 && (
						<Autocomplete.List
							aria-label={ _x(
								'Emoji',
								'emoji picker grid label'
							) }
							className="editor-collab-sidebar-panel__picker-list"
						>
							{ isSearching &&
								searchRows.map( ( row, rowIndex ) =>
									renderRow( row, `search-${ rowIndex }` )
								) }
							{ ! isSearching && frequentRows.length > 0 && (
								<Autocomplete.Group className="editor-collab-sidebar-panel__picker-group">
									<Autocomplete.GroupLabel className="editor-collab-sidebar-panel__picker-category">
										{ __( 'Frequently used' ) }
									</Autocomplete.GroupLabel>
									{ frequentRows.map( ( row, rowIndex ) =>
										renderRow(
											row,
											`frequent-${ rowIndex }`
										)
									) }
								</Autocomplete.Group>
							) }
							{ ! isSearching &&
								visibleGroups.map( ( group ) => (
									<Autocomplete.Group
										key={ group.key }
										className="editor-collab-sidebar-panel__picker-group"
									>
										<Autocomplete.GroupLabel className="editor-collab-sidebar-panel__picker-category">
											{ getGroupLabel( group.key ) }
										</Autocomplete.GroupLabel>
										{ group.rows.map( ( row, rowIndex ) =>
											renderRow(
												row,
												`${ group.key }-${ rowIndex }`
											)
										) }
									</Autocomplete.Group>
								) ) }
						</Autocomplete.List>
					) }
				</div>
			</Autocomplete.Root>
		</div>
	);
}
