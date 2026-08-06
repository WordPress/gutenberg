/**
 * Internal dependencies
 */
import { nonPrintingCharacters } from '../';

const FORMAT_NAME = 'core/non-printing-characters';

// Named by code point rather than written as literals: a test about invisible
// characters should not itself contain invisible characters.
const SPACE = String.fromCodePoint( 0x0020 );
const TAB = String.fromCodePoint( 0x0009 );
const LINE_FEED = String.fromCodePoint( 0x000a );
const NO_BREAK_SPACE = String.fromCodePoint( 0x00a0 );
const NARROW_NO_BREAK_SPACE = String.fromCodePoint( 0x202f );
const FIGURE_SPACE = String.fromCodePoint( 0x2007 );
const ZERO_WIDTH_SPACE = String.fromCodePoint( 0x200b );
const ZERO_WIDTH_JOINER = String.fromCodePoint( 0x200d );
const ZERO_WIDTH_NO_BREAK_SPACE = String.fromCodePoint( 0xfeff );
const OBJECT_REPLACEMENT_CHARACTER = String.fromCodePoint( 0xfffc );

/**
 * Builds the sparse formats array that rich text hands to a prepare handler.
 *
 * @param {string} text The text the formats belong to.
 *
 * @return {Array} A sparse array of the same length as the text.
 */
function emptyFormats( text ) {
	const formats = [];
	formats.length = text.length;
	return formats;
}

function prepare( text, { isEnabled = true, formats } = {} ) {
	return nonPrintingCharacters.__experimentalCreatePrepareEditableTree( {
		isEnabled,
	} )( formats ?? emptyFormats( text ), text );
}

/**
 * Reads back the kind of marker applied at each index, or undefined where no
 * marker was applied.
 *
 * @param {Array}  formats Prepared formats.
 * @param {string} text    The text the formats belong to.
 *
 * @return {Array} Kind of marker per character.
 */
function markersOf( formats, text ) {
	return Array.from( text ).map( ( character, index ) => {
		const format = ( formats[ index ] || [] ).find(
			( { type } ) => type === FORMAT_NAME
		);
		return format?.attributes.characterType;
	} );
}

function hasNoMarkers( formats ) {
	return ! formats.some( ( formatsAtIndex ) =>
		( formatsAtIndex || [] ).some( ( { type } ) => type === FORMAT_NAME )
	);
}

describe( 'nonPrintingCharacters', () => {
	it( 'returns the formats untouched when the preference is off', () => {
		const text = `a${ SPACE }b`;
		const formats = emptyFormats( text );

		expect( prepare( text, { isEnabled: false, formats } ) ).toBe(
			formats
		);
	} );

	it( 'returns the formats untouched when there is nothing to mark', () => {
		const text = 'abc';
		const formats = emptyFormats( text );

		expect( prepare( text, { formats } ) ).toBe( formats );
	} );

	it( 'marks each kind of character it knows about', () => {
		const text = [
			'a',
			SPACE,
			NO_BREAK_SPACE,
			TAB,
			LINE_FEED,
			ZERO_WIDTH_SPACE,
			'b',
		].join( '' );

		expect( markersOf( prepare( text ), text ) ).toEqual( [
			undefined,
			'space',
			'non-breaking-space',
			'tab',
			'line-break',
			'zero-width',
			undefined,
		] );
	} );

	it( 'groups the narrow and figure spaces with the non-breaking space', () => {
		const text = `${ NARROW_NO_BREAK_SPACE }${ FIGURE_SPACE }`;

		expect( markersOf( prepare( text ), text ) ).toEqual( [
			'non-breaking-space',
			'non-breaking-space',
		] );
	} );

	it( 'leaves zero width joiners alone so emoji sequences are not flagged', () => {
		// Family emoji: three people held together by zero width joiners.
		const text = [
			String.fromCodePoint( 0x1f468 ),
			ZERO_WIDTH_JOINER,
			String.fromCodePoint( 0x1f469 ),
			ZERO_WIDTH_JOINER,
			String.fromCodePoint( 0x1f467 ),
		].join( '' );

		expect( hasNoMarkers( prepare( text ) ) ).toBe( true );
	} );

	it( 'leaves the characters rich text writes itself alone', () => {
		// Padding and the object replacement character are not authored text.
		const text = `${ ZERO_WIDTH_NO_BREAK_SPACE }${ OBJECT_REPLACEMENT_CHARACTER }`;

		expect( hasNoMarkers( prepare( text ) ) ).toBe( true );
	} );

	it( 'gives each character in a run its own format reference', () => {
		// The tree builder reuses one element for adjacent characters that
		// share a format reference, which would draw a single marker for a run
		// of spaces instead of one marker per space.
		const text = SPACE.repeat( 3 );
		const formats = prepare( text );

		expect( formats[ 0 ][ 0 ] ).not.toBe( formats[ 1 ][ 0 ] );
		expect( formats[ 1 ][ 0 ] ).not.toBe( formats[ 2 ][ 0 ] );
	} );

	it( 'keeps the formats that were already there and does not mutate them', () => {
		const text = `a${ SPACE }b`;
		const bold = { type: 'core/bold' };
		const formats = emptyFormats( text );
		formats[ 1 ] = [ bold ];

		const prepared = prepare( text, { formats } );

		// The marker is added inside the existing format, not in place of it.
		expect( prepared[ 1 ] ).toEqual( [
			bold,
			{
				type: FORMAT_NAME,
				attributes: { characterType: 'space' },
			},
		] );
		// The array rich text handed us is left as it was.
		expect( formats[ 1 ] ).toEqual( [ bold ] );
		expect( prepared ).not.toBe( formats );
	} );
} );
