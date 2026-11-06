import { __, _n, sprintf } from '@wordpress/i18n';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { Path, SVG } from '@wordpress/components';
import {
	Autocomplete,
	Icon,
	Input,
	InputLayout,
	Text,
	VisuallyHidden,
} from '@wordpress/ui';
import { useDebounce } from '@wordpress/compose';
import {
	createPortal,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { insert, useAnchor } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import { search } from '@wordpress/icons';
import type { FormatEditProps } from '../types';
import {
	getSpecialCharacterCategories,
	searchSpecialCharacters,
} from './characters';
import type { SpecialCharacter } from './characters';

const name = 'core/special-characters';
const title = __( 'Special characters' );

/**
 * An omega (Ω), optically balanced against the text-based icons beside it,
 * such as Bold and Italic.
 */
const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M17.25 11.5001L18 11.5001L17.25 11.5001ZM12 5.99993L12 6.74993V6.74993L12 5.99993ZM13.25 18L13.25 17.25L13.25 18.75L13.25 18ZM17.25 18.7499L18 18.7499L18 17.2499L17.25 17.2499L17.25 17.9999L17.25 18.7499ZM6.75002 11.5L7.50002 11.5V11.5L6.75002 11.5ZM6.75 17.2499L6 17.2499L6 18.7499L6.75 18.7499L6.75 17.9999L6.75 17.2499ZM17.25 11.5001L18 11.5001C18 9.83936 17.4563 8.27798 16.4148 7.1228C15.3652 5.95851 13.8472 5.24993 12 5.24993L12 5.99993L12 6.74993C13.4402 6.74993 14.5473 7.29143 15.3007 8.1272C16.0625 8.97209 16.5 10.1608 16.5 11.5001L17.25 11.5001ZM13.25 18L13.25 18.75C13.4121 18.75 13.5526 18.7052 13.6334 18.6759C13.7288 18.6412 13.8248 18.5962 13.917 18.5473C14.1022 18.449 14.3124 18.3134 14.534 18.1483C14.9788 17.8169 15.5064 17.3389 16.0137 16.7302C17.0259 15.5155 18 13.7264 18 11.5001L17.25 11.5001L16.5 11.5001C16.5 13.2736 15.7241 14.7345 14.8613 15.7699C14.4312 16.2861 13.99 16.6831 13.6378 16.9455C13.461 17.0772 13.3158 17.1682 13.2139 17.2223C13.1625 17.2495 13.1321 17.2621 13.1213 17.266C13.0959 17.2752 13.1504 17.25 13.25 17.25L13.25 18ZM13.25 18L13.25 18.75L17.25 18.7499L17.25 17.9999L17.25 17.2499L13.25 17.25L13.25 18ZM6.75002 11.5L7.50002 11.5C7.50002 10.1607 7.93757 8.97204 8.69927 8.12717C9.45275 7.29142 10.5598 6.74993 12 6.74993L12 5.99993L12 5.24993C10.1528 5.24993 8.63485 5.95848 7.58519 7.12276C6.54375 8.27793 6.00002 9.83929 6.00002 11.5L6.75002 11.5ZM10.75 17.9999L10.75 17.2499C10.8745 17.2499 10.9456 17.2878 10.9189 17.2764C10.9109 17.2729 10.8818 17.259 10.8293 17.2265C10.7258 17.1624 10.5782 17.0554 10.3975 16.9031C10.0382 16.6002 9.58899 16.1523 9.15117 15.5977C8.26323 14.473 7.50002 13.0101 7.50002 11.5L6.75002 11.5L6.00002 11.5C6.00002 13.4899 6.9868 15.277 7.97385 16.5272C8.47352 17.1601 8.99306 17.681 9.43062 18.0499C9.64839 18.2335 9.85622 18.3882 10.0398 18.5019C10.1309 18.5583 10.2283 18.6122 10.3265 18.6544C10.4059 18.6886 10.563 18.7499 10.75 18.7499L10.75 17.9999ZM10.75 17.9999L10.75 17.2499L6.75 17.2499L6.75 17.9999L6.75 18.7499L10.75 18.7499L10.75 17.9999Z" />
	</SVG>
);

/**
 * How many characters each grid row holds. Arrow keys move between rows, so
 * the rows here and the CSS column count must agree.
 */
const COLUMNS = 8;

/**
 * One grid cell, as handed to `Autocomplete.Root` through `items`.
 */
interface CharacterOption {
	// Unique per section; search results get their own prefix.
	key: string;
	value: string;
	label: string;
}

/**
 * A section of the grid while browsing.
 */
interface CharacterOptionGroup {
	key: string;
	label: string;
	items: CharacterOption[];
}

function chunkRows< T >( items: T[] ): T[][] {
	const rows: T[][] = [];
	for ( let i = 0; i < items.length; i += COLUMNS ) {
		rows.push( items.slice( i, i + COLUMNS ) );
	}
	return rows;
}

function toOption(
	character: SpecialCharacter,
	section: string
): CharacterOption {
	return {
		key: `${ section }-${ character.char }`,
		value: character.char,
		label: character.name,
	};
}

/**
 * Formats a character's Unicode code point, e.g. "U+2014".
 *
 * @param char A single character.
 * @return The code point label.
 */
function getCodePoint( char: string ): string {
	return (
		'U+' +
		( char.codePointAt( 0 ) ?? 0 )
			.toString( 16 )
			.toUpperCase()
			.padStart( 4, '0' )
	);
}

/**
 * A character's name with its code point, e.g. "Em dash (U+2014)". It is the
 * cell's accessible name and the preview strip's text, so both carry the
 * same information.
 *
 * @param option The character's grid cell.
 * @return The description.
 */
function describeCharacter( option: CharacterOption ): string {
	return sprintf(
		/* translators: 1: Character name, e.g. "Em dash". 2: Unicode code point, e.g. "U+2014". */
		__( '%1$s (%2$s)' ),
		option.label,
		getCodePoint( option.value )
	);
}

interface InlineUIProps {
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
	onClose: () => void;
	contentRef: React.RefObject< HTMLElement >;
}

function InlineUI( {
	value,
	onChange,
	onFocus,
	onClose,
	contentRef,
}: InlineUIProps ) {
	const popoverAnchor = useAnchor( {
		// eslint-disable-next-line react-hooks/refs
		editableContentElement: contentRef.current,
		settings: specialCharacters,
	} );
	const inputRef = useRef< HTMLInputElement >( null );
	const categories = useMemo( getSpecialCharacterCategories, [] );
	const [ query, setQuery ] = useState( '' );
	const [ highlighted, setHighlighted ] = useState< CharacterOption >();
	const isSearching = query.trim() !== '';

	/*
	 * The items handed to `Autocomplete.Root`: sections while browsing, one
	 * flat list while searching. Filtering is ours (`filter={ null }`), so
	 * these are already the visible results.
	 */
	const items = useMemo( (): CharacterOptionGroup[] | CharacterOption[] => {
		if ( isSearching ) {
			return searchSpecialCharacters( categories, query ).map(
				( character ) => toOption( character, 'search' )
			);
		}
		return categories.map( ( category ) => ( {
			key: category.slug,
			label: category.label,
			items: category.characters.map( ( character ) =>
				toOption( character, category.slug )
			),
		} ) );
	}, [ categories, isSearching, query ] );

	/*
	 * Announce the result count once typing pauses, so a screen reader
	 * doesn't speak after every keystroke. `Autocomplete.Status` stays
	 * mounted, so changing its text is announced reliably.
	 */
	const resultCount = isSearching ? items.length : 0;
	let statusMessage = '';
	if ( isSearching ) {
		statusMessage = resultCount
			? sprintf(
					/* translators: %d: Number of characters found. */
					_n(
						'%d character found.',
						'%d characters found.',
						resultCount
					),
					resultCount
				)
			: __( 'No characters found.' );
	}
	const [ announcedStatus, setAnnouncedStatus ] = useState( '' );
	const announceStatus = useDebounce( setAnnouncedStatus, 500 );
	useEffect( () => {
		announceStatus( statusMessage );
	}, [ announceStatus, statusMessage ] );

	function onSelect( option: CharacterOption ) {
		onChange( insert( value, option.value ) );
		onClose();
		onFocus();
	}

	/*
	 * Rows are named after their section, so moving through the grid reads
	 * "Em dash (U+2014)" and the section rather than every name in the row,
	 * and moving into the next section announces it.
	 */
	const renderRows = ( options: CharacterOption[], rowLabel: string ) =>
		chunkRows( options ).map( ( row, rowIndex ) => (
			<Autocomplete.Row
				key={ rowIndex }
				aria-label={ rowLabel }
				className="format-library-special-characters__row"
			>
				{ row.map( ( option ) => (
					<Autocomplete.Item
						key={ option.key }
						value={ option }
						className="format-library-special-characters__character"
						// Enter on the highlighted cell clicks it too.
						onClick={ () => onSelect( option ) }
					>
						<Autocomplete.ItemLabel className="format-library-special-characters__character-label">
							<span aria-hidden="true">{ option.value }</span>
							{ /* The cell's name, as text, so screen readers don't
							report the hidden glyph as blank. */ }
							<VisuallyHidden>
								{ describeCharacter( option ) }
							</VisuallyHidden>
						</Autocomplete.ItemLabel>
					</Autocomplete.Item>
				) ) }
			</Autocomplete.Row>
		) );

	/*
	 * Rendered into the page's body, not where the format renders. Format
	 * controls render next to the editable text, inside the editor canvas,
	 * and the popup places hidden focus guards beside its React position.
	 * There they would sit among the blocks: the paragraph would no longer
	 * be the first child, pick up block spacing, and shift down while the
	 * picker is open.
	 */
	return createPortal(
		<Autocomplete.Root
			// Mounted only while visible, so it is always open.
			open
			onOpenChange={ ( nextOpen: boolean, { reason } ) => {
				// Picking a cell closes through `onSelect`.
				if ( nextOpen || reason === 'item-press' ) {
					return;
				}
				onClose();
				// Escape: put the caret back where the character would have
				// gone. Clicking elsewhere leaves focus where it landed.
				if ( reason === 'escape-key' ) {
					onFocus();
				}
			} }
			grid
			// Sections while browsing, a flat list while searching. Base UI
			// takes either at runtime, but its overloads can't take the union.
			items={ items as readonly CharacterOption[] }
			filter={ null }
			// Enter picks the top result once the user has typed.
			autoHighlight
			value={ query }
			onValueChange={ ( nextQuery: string, { reason } ) => {
				// Picking a cell would otherwise write it into the field.
				if ( reason === 'item-press' ) {
					return;
				}
				setQuery( nextQuery );
			} }
			onItemHighlighted={ ( option?: CharacterOption ) =>
				setHighlighted( option )
			}
		>
			<Autocomplete.Popup
				className="format-library-special-characters__popup"
				// The search field inside makes this a dialog, which needs a name.
				aria-label={ title }
				width="content"
				// There is no trigger to return to: the format puts the caret
				// back itself, and only after Escape or a pick.
				initialFocus={ inputRef }
				finalFocus={ false }
				positioner={
					// Below the caret, rather than below a trigger button.
					<Autocomplete.Positioner anchor={ popoverAnchor } />
				}
			>
				<div className="format-library-special-characters__search">
					<Autocomplete.InputGroup>
						<Autocomplete.Input
							ref={ inputRef }
							aria-label={ __( 'Search special characters' ) }
							placeholder={ __( 'Search' ) }
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
				</div>
				{ /*
				 * The arrow keys in the search field drive the grid, so keep
				 * its scroller out of the Tab order. Browsers would otherwise
				 * make it a Tab stop, since none of the cells are tabbable.
				 */ }
				<div
					className="format-library-special-characters__viewport"
					tabIndex={ -1 }
				>
					{ /* Shown, but announced through `Autocomplete.Status`, so it
					isn't spoken twice. */ }
					<Autocomplete.Empty aria-hidden="true">
						{ __( 'No characters found.' ) }
					</Autocomplete.Empty>
					<Autocomplete.List
						aria-label={ __( 'Characters' ) }
						className={
							isSearching
								? 'format-library-special-characters__list is-searching'
								: 'format-library-special-characters__list'
						}
					>
						{ isSearching
							? renderRows(
									items as CharacterOption[],
									__( 'Search results' )
								)
							: ( group: CharacterOptionGroup ) => (
									<Autocomplete.Group
										key={ group.key }
										items={ group.items }
										className="format-library-special-characters__group"
									>
										<Autocomplete.GroupLabel className="format-library-special-characters__group-label">
											{ group.label }
										</Autocomplete.GroupLabel>
										{ renderRows(
											group.items,
											group.label
										) }
									</Autocomplete.Group>
								) }
					</Autocomplete.List>
				</div>
				<Autocomplete.Status>
					<VisuallyHidden>{ announcedStatus }</VisuallyHidden>
				</Autocomplete.Status>
				{ /* A sighted-user aid only: each cell's accessible name already
				carries the same name and code point. */ }
				<div
					className="format-library-special-characters__preview"
					aria-hidden="true"
				>
					{ highlighted && (
						<>
							<span className="format-library-special-characters__preview-character">
								{ highlighted.value }
							</span>
							<Text
								variant="body-sm"
								className="format-library-special-characters__preview-name"
							>
								{ describeCharacter( highlighted ) }
							</Text>
						</>
					) }
				</div>
			</Autocomplete.Popup>
		</Autocomplete.Root>,
		document.body
	);
}

function Edit( { value, onChange, onFocus, contentRef }: FormatEditProps ) {
	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );

	return (
		<>
			<RichTextToolbarButton
				icon={ icon }
				title={ title }
				onClick={ () => setIsPopoverVisible( true ) }
				role="menuitem"
			/>
			{ isPopoverVisible && (
				<InlineUI
					value={ value }
					onChange={ onChange }
					onFocus={ onFocus }
					onClose={ () => setIsPopoverVisible( false ) }
					contentRef={ contentRef }
				/>
			) }
		</>
	);
}

/**
 * Inserts special characters as plain text. The format is never applied to
 * content: it registers only to add its toolbar item, so the tag and class
 * name are placeholders that real markup is unlikely to match.
 */
export const specialCharacters = {
	name,
	title,
	tagName: 'span',
	className: 'wp-special-characters',
	edit: Edit,
};
