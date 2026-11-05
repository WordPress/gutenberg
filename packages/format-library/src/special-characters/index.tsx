import { __, sprintf } from '@wordpress/i18n';
// @ts-expect-error Block Editor not fully typed yet.
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { Popover as WCPopover } from '@wordpress/components';
import { Autocomplete, Icon, Input, InputLayout, Text } from '@wordpress/ui';
import { useMemo, useState } from '@wordpress/element';
import { insert, useAnchor } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import { search, typography as icon } from '@wordpress/icons';
import type { FormatEditProps } from '../types';
import {
	getSpecialCharacterCategories,
	searchSpecialCharacters,
} from './characters';
import type { SpecialCharacter } from './characters';
import {
	getFrequentCharacters,
	useFrequentCharacters,
} from './frequent-characters';

const name = 'core/special-characters';
const title = __( 'Special characters' );

/**
 * How many characters each grid row holds. Arrow keys move between rows, so
 * the rows here and the CSS column count must agree.
 */
const COLUMNS = 8;

/**
 * One grid cell, as handed to `Autocomplete.Root` through `items`.
 */
interface CharacterOption {
	// Unique per section, since a character can also be in "Frequently used".
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
	const categories = useMemo( getSpecialCharacterCategories, [] );
	const characterByChar = useMemo( () => {
		const map = new Map< string, SpecialCharacter >();
		for ( const category of categories ) {
			for ( const character of category.characters ) {
				map.set( character.char, character );
			}
		}
		return map;
	}, [ categories ] );
	const { entries, recordUse } = useFrequentCharacters();
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
		// Hidden while searching, where it would repeat category results.
		const frequent = getFrequentCharacters( entries, ( char ) =>
			characterByChar.has( char )
		).map( ( char ) => characterByChar.get( char )! );
		return [
			{
				key: 'frequent',
				label: __( 'Frequently used' ),
				items: frequent.map( ( character ) =>
					toOption( character, 'frequent' )
				),
			},
			...categories.map( ( category ) => ( {
				key: category.slug,
				label: category.label,
				items: category.characters.map( ( character ) =>
					toOption( character, category.slug )
				),
			} ) ),
		].filter( ( group ) => group.items.length > 0 );
	}, [ categories, characterByChar, entries, isSearching, query ] );

	function onSelect( option: CharacterOption ) {
		recordUse( option.value );
		onChange( insert( value, option.value ) );
		onClose();
		onFocus();
	}

	const renderRows = ( options: CharacterOption[] ) =>
		chunkRows( options ).map( ( row, rowIndex ) => (
			<Autocomplete.Row
				key={ rowIndex }
				className="format-library-special-characters__row"
			>
				{ row.map( ( option ) => (
					<Autocomplete.Item
						key={ option.key }
						value={ option }
						aria-label={ option.label }
						className="format-library-special-characters__character"
						// Enter on the highlighted cell clicks it too.
						onClick={ () => onSelect( option ) }
					>
						<Autocomplete.ItemLabel className="format-library-special-characters__character-label">
							<span aria-hidden="true">{ option.value }</span>
						</Autocomplete.ItemLabel>
					</Autocomplete.Item>
				) ) }
			</Autocomplete.Row>
		) );

	return (
		<WCPopover
			anchor={ popoverAnchor }
			className="format-library-special-characters__popover"
			placement="bottom-start"
			onClose={ () => {
				// Escape: put the caret back where the character would have gone.
				onClose();
				onFocus();
			} }
			// Clicking elsewhere closes the popover without stealing focus back.
			onFocusOutside={ onClose }
		>
			<Autocomplete.Root
				inline
				open
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
				<div className="format-library-special-characters__search">
					<Autocomplete.InputGroup>
						<Autocomplete.Input
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
					<Autocomplete.Empty>
						{ __( 'No characters found.' ) }
					</Autocomplete.Empty>
					<Autocomplete.List
						aria-label={ title }
						className={
							isSearching
								? 'format-library-special-characters__list is-searching'
								: 'format-library-special-characters__list'
						}
					>
						{ isSearching
							? renderRows( items as CharacterOption[] )
							: ( group: CharacterOptionGroup ) => (
									<Autocomplete.Group
										key={ group.key }
										items={ group.items }
										className="format-library-special-characters__group"
									>
										<Autocomplete.GroupLabel className="format-library-special-characters__group-label">
											{ group.label }
										</Autocomplete.GroupLabel>
										{ renderRows( group.items ) }
									</Autocomplete.Group>
								) }
					</Autocomplete.List>
				</div>
				{ /* A sighted-user aid only: each cell already carries its name
				for assistive technology. */ }
				<div
					className="format-library-special-characters__preview"
					aria-hidden="true"
				>
					{ highlighted && (
						<>
							<span className="format-library-special-characters__preview-character">
								{ highlighted.value }
							</span>
							<Text variant="body-sm">
								{ sprintf(
									/* translators: 1: Character name, e.g. "Em dash". 2: Unicode code point, e.g. "U+2014". */
									__( '%1$s (%2$s)' ),
									highlighted.label,
									getCodePoint( highlighted.value )
								) }
							</Text>
						</>
					) }
				</div>
			</Autocomplete.Root>
		</WCPopover>
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
