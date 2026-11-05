import { __, sprintf } from '@wordpress/i18n';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { Path, SVG } from '@wordpress/components';
import { Autocomplete, Icon, Input, InputLayout, Text } from '@wordpress/ui';
import { useMemo, useRef, useState } from '@wordpress/element';
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
 * The Classic editor's "Special character" icon: the `editor-customchar`
 * Dashicon (an omega), kept at its 20px size within the 24px icon grid.
 */
const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 24 24">
		<Path d="M10 5.4c1.27 0 2.24.36 2.91 1.08.66.71 1 1.76 1 3.13 0 1.28-.23 2.37-.69 3.27-.47.89-1.27 1.52-2.22 2.12v2h6v-2h-3.69c.92-.64 1.62-1.34 2.12-2.34.49-1.01.74-2.13.74-3.35 0-1.78-.55-3.19-1.65-4.22S11.92 3.54 10 3.54s-3.43.53-4.52 1.57c-1.1 1.04-1.65 2.44-1.65 4.2 0 1.21.24 2.31.73 3.33.48 1.01 1.19 1.71 2.1 2.36H3v2h6v-2c-.98-.64-1.8-1.28-2.24-2.17-.45-.89-.67-1.96-.67-3.22 0-1.37.33-2.41 1-3.13C7.75 5.76 8.72 5.4 10 5.4z" />
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

	function onSelect( option: CharacterOption ) {
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
							<Text
								variant="body-sm"
								className="format-library-special-characters__preview-name"
							>
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
			</Autocomplete.Popup>
		</Autocomplete.Root>
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
