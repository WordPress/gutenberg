/**
 * WordPress dependencies
 */
import {
	RichTextData,
	store as richTextStore,
	unregisterFormatType,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	acceptInlineDeletion,
	rejectInlineDeletion,
	buildSuggestionMarkerAttributes,
} from '../operations';
import { registerSuggestionFormat, SUGGESTION_FORMAT_NAME } from '../format';

const getFormatType = ( name ) => select( richTextStore ).getFormatType( name );

const del = ( id, text ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="del">${ text }</mark>`;

describe( 'inline deletion operations', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	describe( 'acceptInlineDeletion', () => {
		it( 'removes the marked text and its marker', () => {
			const value = RichTextData.fromHTMLString(
				`keep ${ del( 5, 'remove me' ) } tail`
			);
			const result = acceptInlineDeletion( value, 5 );
			expect( result.toHTMLString() ).toBe( 'keep  tail' );
		} );

		it( 'leaves other text and an unrelated marker intact', () => {
			const value = RichTextData.fromHTMLString(
				`${ del( 1, 'gone' ) } and ${ del( 2, 'stay' ) }`
			);
			const result = acceptInlineDeletion( value, 1 );
			const html = result.toHTMLString();
			expect( html ).not.toContain( 'gone' );
			expect( html ).toContain( 'stay' );
			expect( html ).toContain( 'data-suggestion-id="2"' );
		} );

		it( 'returns the value unchanged when the marker is absent', () => {
			const value = RichTextData.fromHTMLString( 'no markers here' );
			expect( acceptInlineDeletion( value, 99 ).toHTMLString() ).toBe(
				'no markers here'
			);
		} );

		it( 'returns a non-rich-text value unchanged', () => {
			expect( acceptInlineDeletion( 'plain', 5 ) ).toBe( 'plain' );
			expect( acceptInlineDeletion( undefined, 5 ) ).toBeUndefined();
		} );

		it( 'resolves the range after an unrelated edit shifted the marker', () => {
			// A leading edit pushes the marker right; accept must still target
			// the marker's live range, not a stored offset.
			const value = RichTextData.fromHTMLString(
				`prepended ${ del( 7, 'doomed' ) }`
			);
			const result = acceptInlineDeletion( value, 7 );
			expect( result.toHTMLString() ).toBe( 'prepended ' );
		} );
	} );

	describe( 'rejectInlineDeletion', () => {
		it( 'keeps the text and drops the marker', () => {
			const value = RichTextData.fromHTMLString(
				`keep ${ del( 5, 'kept text' ) } tail`
			);
			const result = rejectInlineDeletion( value, 5 );
			const html = result.toHTMLString();
			expect( html ).toBe( 'keep kept text tail' );
			expect( html ).not.toContain( 'wp-suggestion' );
		} );

		it( 'only unwraps the targeted marker', () => {
			const value = RichTextData.fromHTMLString(
				`${ del( 1, 'one' ) } ${ del( 2, 'two' ) }`
			);
			const result = rejectInlineDeletion( value, 1 );
			const html = result.toHTMLString();
			expect( html ).toContain( 'one' );
			expect( html ).not.toContain( 'data-suggestion-id="1"' );
			expect( html ).toContain( 'data-suggestion-id="2"' );
		} );

		it( 'returns the value unchanged when the marker is absent', () => {
			const value = RichTextData.fromHTMLString( 'nothing to reject' );
			expect( rejectInlineDeletion( value, 99 ).toHTMLString() ).toBe(
				'nothing to reject'
			);
		} );

		it( 'returns a non-rich-text value unchanged', () => {
			expect( rejectInlineDeletion( 'plain', 5 ) ).toBe( 'plain' );
		} );
	} );
} );

describe( 'buildSuggestionMarkerAttributes', () => {
	it( 'stringifies the id and carries the type and author', () => {
		expect(
			buildSuggestionMarkerAttributes( {
				id: 42,
				type: 'del',
				authorId: 7,
			} )
		).toEqual( {
			'data-suggestion-id': '42',
			'data-suggestion-type': 'del',
			'data-author': '7',
		} );
	} );

	it( 'omits the author attribute when no author id is given', () => {
		expect(
			buildSuggestionMarkerAttributes( { id: 1, type: 'add' } )
		).toEqual( {
			'data-suggestion-id': '1',
			'data-suggestion-type': 'add',
		} );
		expect(
			buildSuggestionMarkerAttributes( {
				id: 1,
				type: 'del',
				authorId: null,
			} )
		).not.toHaveProperty( 'data-author' );
	} );
} );
