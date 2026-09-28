import type { ReactNode } from 'react';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import {
	Autocomplete,
	Icon,
	Input,
	InputLayout,
	VisuallyHidden,
} from '@wordpress/ui';
import { search } from '@wordpress/icons';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
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

/**
 * One grid cell, as handed to `Autocomplete.Root` through `items`.
 */
interface EmojiOption {
	// Unique per section, since an emoji can appear in "Frequently used" too.
	key: string;
	// The emoji character, with the user's skin tone applied.
	value: string;
	label: string;
	// Normalized hexcode of the base record, used for usage tracking.
	hexKey: string;
}

/**
 * A category section of the grid while browsing.
 */
interface EmojiOptionGroup {
	key: string;
	label: string;
	items: EmojiOption[];
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
 * @param emojis Emoji records or options.
 * @return Rows of up to `COLUMNS` emoji each.
 */
export function chunkRows< T >( emojis: T[] ): T[][] {
	const rows: T[][] = [];
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

	const groups = useMemo(
		() => ( data ? groupEmojis( data ) : [] ),
		[ data ]
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

	const isSearching = !! query.trim();

	/*
	 * The items handed to `Autocomplete.Root`: category groups while
	 * browsing, a flat list while searching. Filtering stays ours
	 * (`filter={ null }`), since it matches label overrides and Emojibase
	 * tags, so these are already the visible results.
	 */
	const items = useMemo( (): EmojiOptionGroup[] | EmojiOption[] => {
		const toOption = (
			entry: EmojibaseEntry,
			prefix: string
		): EmojiOption => {
			/*
			 * The variant is shown and selected; the base record still
			 * drives search, usage, and the grid key.
			 */
			const display = applySkinTone( entry, skinTone );
			return {
				key: `${ prefix }-${ entry.hexcode }`,
				value: display.emoji,
				label:
					getOverrideLabel( labelOverrides, display.hexcode ) ||
					display.label ||
					'',
				hexKey: normalizeHexcode( entry.hexcode ),
			};
		};

		if ( isSearching ) {
			/*
			 * One flat grid of results, as in the macOS picker:
			 * per-category sections would scatter a few hits under
			 * mostly-empty headers.
			 */
			return groups
				.flatMap( ( group ) =>
					searchEmojis( group.emojis, query, labelOverrides )
				)
				.map( ( entry ) => toOption( entry, 'search' ) );
		}

		// Hidden during search, where it would duplicate the category hits.
		const frequent = frequentKeys
			.map( ( key ) => recordByHexKey.get( key ) )
			.filter( ( entry ): entry is EmojibaseEntry => Boolean( entry ) );

		return [
			{
				key: 'frequent',
				label: __( 'Frequently used' ),
				items: frequent.map( ( entry ) =>
					toOption( entry, 'frequent' )
				),
			},
			...groups.map( ( group ) => ( {
				key: String( group.key ),
				label: getGroupLabel( group.key ),
				items: group.emojis.map( ( entry ) =>
					toOption( entry, String( group.key ) )
				),
			} ) ),
		].filter( ( group ) => group.items.length > 0 );
	}, [
		groups,
		isSearching,
		query,
		labelOverrides,
		frequentKeys,
		recordByHexKey,
		skinTone,
	] );

	const matchCount = isSearching ? items.length : 0;

	/**
	 * Render grid rows of emoji cells, recording usage on selection.
	 *
	 * @param options Emoji options to lay out.
	 * @return The rendered rows.
	 */
	const renderRows = ( options: EmojiOption[] ) =>
		chunkRows( options ).map( ( row, rowIndex ) => (
			<Autocomplete.Row
				key={ rowIndex }
				className="editor-collab-sidebar-panel__picker-row"
			>
				{ row.map( ( option ) => (
					<Autocomplete.Item
						key={ option.key }
						value={ option }
						className="editor-collab-sidebar-panel__picker-emoji"
						aria-label={ option.label }
						// Enter on the highlighted cell clicks it too.
						onClick={ () => {
							recordUse( option.hexKey );
							onSelect( option.value );
						} }
					>
						{ option.value }
					</Autocomplete.Item>
				) ) }
			</Autocomplete.Row>
		) );

	// The parent swaps in the curated picker so reacting keeps working.
	useEffect( () => {
		if ( error ) {
			onError?.();
		}
	}, [ error, onError ] );

	if ( ! baseUrl ) {
		return null;
	}

	let status: ReactNode = null;
	if ( isLoading ) {
		status = __( 'Loading…' );
	} else if ( error ) {
		status = __( 'Couldn’t load emojis.' );
	} else if ( isSearching && matchCount > 0 ) {
		status = (
			<VisuallyHidden>
				{ sprintf(
					/* translators: %d: number of emojis matching the search. */
					_n( '%d emoji found.', '%d emojis found.', matchCount ),
					matchCount
				) }
			</VisuallyHidden>
		);
	}

	return (
		<div className="editor-collab-sidebar-panel__picker">
			{ /*
			 * An always-open inline autocomplete: focus stays in the search
			 * field while the arrow keys move a highlight through the grid
			 * (`aria-activedescendant`), and Enter picks the highlighted
			 * emoji.
			 */ }
			<Autocomplete.Root
				inline
				open
				grid
				items={ items }
				filter={ null }
				// Enter picks the top hit once the user has typed.
				autoHighlight
				value={ query }
				onValueChange={ setQuery }
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
				<div className="editor-collab-sidebar-panel__picker-viewport">
					<Autocomplete.Status>{ status }</Autocomplete.Status>
					<Autocomplete.Empty>
						{ isLoading || error ? null : __( 'No emoji found.' ) }
					</Autocomplete.Empty>
					<Autocomplete.List
						aria-label={ _x( 'Emoji', 'emoji picker grid label' ) }
						className="editor-collab-sidebar-panel__picker-list"
					>
						{ isSearching
							? renderRows( items as EmojiOption[] )
							: ( group: EmojiOptionGroup ) => (
									<Autocomplete.Group
										key={ group.key }
										items={ group.items }
										className="editor-collab-sidebar-panel__picker-group"
									>
										<Autocomplete.GroupLabel className="editor-collab-sidebar-panel__picker-category">
											{ group.label }
										</Autocomplete.GroupLabel>
										{ renderRows( group.items ) }
									</Autocomplete.Group>
								) }
					</Autocomplete.List>
				</div>
			</Autocomplete.Root>
		</div>
	);
}
