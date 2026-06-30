/**
 * WordPress dependencies
 */
import {
	RichTextData,
	create,
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_TYPE_ATTRIBUTE,
	SUGGESTION_TYPE_DELETION,
	SUGGESTION_TYPE_ADDITION,
	suggestionFormat,
	findSuggestionRange,
} from '../format';

const isRegistered = () =>
	!! select( richTextStore ).getFormatType( SUGGESTION_FORMAT_NAME );

/**
 * Read the suggestion-type attribute off whichever marker covers `offset`.
 *
 * @param {string} html   Serialized rich-text HTML.
 * @param {number} offset Character offset to inspect.
 * @return {?string} The marker's type attribute, or null.
 */
function typeAt( html, offset ) {
	const { formats } = create( { html } );
	const hit = formats[ offset ]?.find(
		( f ) => f.type === SUGGESTION_FORMAT_NAME
	);
	return hit?.attributes?.[ SUGGESTION_TYPE_ATTRIBUTE ] ?? null;
}

describe( 'suggestion format', () => {
	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( SUGGESTION_FORMAT_NAME, suggestionFormat );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	it( 'round-trips a deletion marker through rich text', () => {
		const html =
			'keep <mark class="wp-suggestion" data-suggestion-id="5" data-suggestion-type="del" data-author="2">remove me</mark> tail';
		const value = RichTextData.fromHTMLString( html );
		const out = value.toHTMLString();
		expect( out ).toContain( 'data-suggestion-id="5"' );
		expect( out ).toContain( 'data-suggestion-type="del"' );
		expect( out ).toContain( 'data-author="2"' );
	} );

	it( 'resolves a deletion marker range by id', () => {
		const value = RichTextData.fromHTMLString(
			'keep <mark class="wp-suggestion" data-suggestion-id="5" data-suggestion-type="del">remove me</mark> tail'
		);
		expect( findSuggestionRange( value, 5 ) ).toEqual( {
			start: 5,
			end: 14,
		} );
	} );

	it( 'resolves an addition marker range by id', () => {
		const value = RichTextData.fromHTMLString(
			'before <mark class="wp-suggestion" data-suggestion-id="9" data-suggestion-type="add">added</mark>'
		);
		expect( findSuggestionRange( value, 9 ) ).toEqual( {
			start: 7,
			end: 12,
		} );
	} );

	it( 'distinguishes del vs add markers on the same block', () => {
		const html =
			'<mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="del">x</mark>' +
			' mid ' +
			'<mark class="wp-suggestion" data-suggestion-id="2" data-suggestion-type="add">y</mark>';
		expect( typeAt( html, 0 ) ).toBe( SUGGESTION_TYPE_DELETION );
		expect( typeAt( html, 6 ) ).toBe( SUGGESTION_TYPE_ADDITION );
	} );

	it( 'returns null for a missing id', () => {
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="del">x</mark>'
		);
		expect( findSuggestionRange( value, 99 ) ).toBeNull();
	} );

	it( 'ignores a note marker (different class) sharing the block', () => {
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-note" data-id="1">noted</mark>'
		);
		expect( findSuggestionRange( value, 1 ) ).toBeNull();
	} );
} );
