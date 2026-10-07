import type { ReactElement, ReactNode } from 'react';
import clsx from 'clsx';
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
	normalizeHexcode,
	useEmojibaseConfig,
	useEmojibaseData,
} from './emojibase-data';
import type { EmojibaseEntry } from './emojibase-data';
import { useFrequentEmojis } from './frequent-emojis';
import { emojiToHexKey, getCuratedLabel } from './reaction-emojis';
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
	/**
	 * The button that opens the picker, passed to `Autocomplete.Trigger`
	 * as its `render` element.
	 */
	trigger: ReactElement;
	/**
	 * Whether the trigger is disabled.
	 */
	disabled?: boolean;
	/**
	 * Accessible name for the picker popup.
	 */
	label: string;
	/**
	 * Hex keys of the emoji the current user has already reacted with,
	 * marked in the grid.
	 */
	reactedHexKeys?: string[];
	onSelect: ( emoji: string ) => void;
}

/**
 * Preference key (in the `core` scope) storing the user's default emoji
 * skin tone: 0 (default yellow) through 5 (dark), matching Emojibase
 * `tone` values.
 */
export const SKIN_TONE_PREFERENCE_KEY = 'emojiPickerSkinTone';

const COLUMNS = 6;

const EMPTY_HEX_KEYS: string[] = [];

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
 * @param emojis Emoji records.
 * @param query  Search query.
 * @return Matching emoji records.
 */
export function searchEmojis(
	emojis: EmojibaseEntry[],
	query: string
): EmojibaseEntry[] {
	const trimmed = query.trim().toLowerCase();
	if ( ! trimmed ) {
		return emojis;
	}
	return emojis.filter( ( entry ) => {
		/*
		 * Match both the curated and the Emojibase label, so searching
		 * either name finds the emoji.
		 */
		const curated = getCuratedLabel( normalizeHexcode( entry.hexcode ) );
		if ( curated && curated.toLowerCase().includes( trimmed ) ) {
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
 * Searchable emoji picker: a trigger button opening an autocomplete popup
 * with the search field on top of the emoji grid. Emoji data and labels
 * come from the per-locale Emojibase files at `noteEmojibaseUrl`; UI chrome
 * strings go through `@wordpress/i18n`. Without a dataset (no URL
 * configured, or the fetch failed) the popup shows an error message.
 *
 * @param props                Component props.
 * @param props.trigger        The button that opens the picker.
 * @param props.disabled       Whether the trigger is disabled.
 * @param props.label          Accessible name for the popup.
 * @param props.reactedHexKeys Hex keys of the user's own reactions.
 * @param props.onSelect       Called with the selected emoji character.
 */
export default function EmojiPicker( {
	trigger,
	disabled = false,
	label,
	reactedHexKeys = EMPTY_HEX_KEYS,
	onSelect,
}: EmojiPickerProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	/*
	 * Every note renders a trigger, so hold the dataset fetch until the
	 * user reaches for one: hovering, focusing, or opening it warms the
	 * data, ideally before the popup opens.
	 */
	const [ isWarm, setIsWarm ] = useState( false );
	const warm = () => setIsWarm( true );
	const { baseUrl } = useEmojibaseConfig();
	const [ locale ] = useState( detectLocale );
	const {
		data: dataset,
		isLoading,
		error,
		retry,
	} = useEmojibaseData( isWarm ? baseUrl : null, locale );
	const data = useMemo( () => dataset ?? [], [ dataset ] );
	const [ query, setQuery ] = useState( '' );

	/*
	 * Announce once when a pending load fills the grid. A cached dataset
	 * renders straight away, and searching filters synchronously, so
	 * neither needs an announcement.
	 */
	const [ hasJustLoaded, setHasJustLoaded ] = useState( false );
	const wasLoadingRef = useRef( isLoading );
	useEffect( () => {
		if ( wasLoadingRef.current && ! isLoading && ! error ) {
			setHasJustLoaded( true );
		}
		wasLoadingRef.current = isLoading;
	}, [ isLoading, error ] );

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

	const groups = useMemo( () => groupEmojis( data ), [ data ] );

	// Resolves stored frequently-used hex keys back to full records.
	const recordByHexKey = useMemo( () => {
		const map = new Map< string, EmojibaseEntry >();
		for ( const entry of data ) {
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
	 * (`filter={ null }`), since it matches curated labels and Emojibase
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
					getCuratedLabel( normalizeHexcode( display.hexcode ) ) ||
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
				.flatMap( ( group ) => searchEmojis( group.emojis, query ) )
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
	}, [ groups, isSearching, query, frequentKeys, recordByHexKey, skinTone ] );

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
				{ row.map( ( option ) => {
					const isReacted = reactedHexKeys.includes(
						emojiToHexKey( option.value )
					);
					return (
						<Autocomplete.Item
							key={ option.key }
							value={ option }
							className={ clsx(
								'editor-collab-sidebar-panel__picker-emoji',
								{ 'is-reacted': isReacted }
							) }
							aria-label={
								isReacted
									? sprintf(
											/* translators: %s: emoji name. */
											__( '%s, your reaction' ),
											option.label
										)
									: option.label
							}
							// Enter on the highlighted cell clicks it too.
							onClick={ () => {
								recordUse( option.hexKey );
								setIsOpen( false );
								onSelect( option.value );
							} }
						>
							<Autocomplete.ItemLabel className="editor-collab-sidebar-panel__picker-emoji-label">
								<span aria-hidden="true">{ option.value }</span>
							</Autocomplete.ItemLabel>
						</Autocomplete.Item>
					);
				} ) }
			</Autocomplete.Row>
		) );

	const loadFailed = !! error || ! baseUrl;
	let status: ReactNode = null;
	if ( isLoading ) {
		status = __( 'Loading…' );
	} else if ( loadFailed ) {
		status = __( 'Couldn’t load emojis.' );
	} else if ( hasJustLoaded && ! isSearching && groups.length > 0 ) {
		// An empty dataset is left to `Autocomplete.Empty`.
		const emojiCount = groups.reduce(
			( total, group ) => total + group.emojis.length,
			0
		);
		status = (
			<VisuallyHidden>
				{ sprintf(
					/* translators: %d: number of emojis available to pick. */
					_n(
						'%d emoji available.',
						'%d emojis available.',
						emojiCount
					),
					emojiCount
				) }
			</VisuallyHidden>
		);
	}

	return (
		<Autocomplete.Root
			grid
			open={ isOpen }
			onOpenChange={ ( nextOpen: boolean ) => {
				setIsOpen( nextOpen );
				if ( nextOpen ) {
					warm();
					// A failed load would otherwise stick until reload.
					if ( error ) {
						retry();
					}
				}
			} }
			// Start each opening from the full grid.
			onOpenChangeComplete={ ( nextOpen: boolean ) => {
				if ( ! nextOpen ) {
					setQuery( '' );
				}
			} }
			items={ items }
			filter={ null }
			// Enter picks the top hit once the user has typed.
			autoHighlight
			value={ query }
			onValueChange={ ( value: string, { reason } ) => {
				// Picking a cell would otherwise fill the search field.
				if ( reason === 'item-press' ) {
					return;
				}
				setQuery( value );
				// Searches stay quiet, so drop the load announcement.
				setHasJustLoaded( false );
			} }
		>
			<Autocomplete.Trigger
				render={ trigger }
				disabled={ disabled }
				onMouseEnter={ warm }
				onFocus={ warm }
			/>
			<Autocomplete.Popup
				aria-label={ label }
				width="content"
				className="editor-collab-sidebar-panel__picker"
				positioner={
					<Autocomplete.Positioner side="bottom" align="end" />
				}
			>
				<div className="editor-collab-sidebar-panel__picker-search">
					<Autocomplete.InputGroup className="editor-collab-sidebar-panel__picker-input">
						<Autocomplete.Input
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
				{ /*
				 * The arrow keys in the search field drive the grid, so
				 * keep its scroller out of the Tab order. Browsers would
				 * otherwise make it a Tab stop, since none of the cells are
				 * tabbable, and a screen reader would read out every emoji.
				 */ }
				<div
					className="editor-collab-sidebar-panel__picker-viewport"
					tabIndex={ -1 }
				>
					<Autocomplete.Status>{ status }</Autocomplete.Status>
					<Autocomplete.Empty>
						{ isLoading || loadFailed
							? null
							: __( 'No emoji found.' ) }
					</Autocomplete.Empty>
					<Autocomplete.List
						aria-label={ _x( 'Emoji', 'emoji picker grid label' ) }
						className={ clsx(
							'editor-collab-sidebar-panel__picker-list',
							{ 'is-searching': isSearching }
						) }
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
			</Autocomplete.Popup>
		</Autocomplete.Root>
	);
}
