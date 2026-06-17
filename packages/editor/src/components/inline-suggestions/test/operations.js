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
	acceptInlineAddition,
	rejectInlineAddition,
	insertInlineAddition,
	buildSuggestionMarkerAttributes,
} from '../operations';
import { registerSuggestionFormat, SUGGESTION_FORMAT_NAME } from '../format';

const getFormatType = ( name ) => select( richTextStore ).getFormatType( name );

const del = ( id, text ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="del">${ text }</mark>`;

const add = ( id, text ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="add">${ text }</mark>`;

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

describe( 'inline addition operations', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	describe( 'acceptInlineAddition', () => {
		it( 'keeps the proposed text and drops the marker', () => {
			const value = RichTextData.fromHTMLString(
				`keep ${ add( 5, 'new text' ) } tail`
			);
			const result = acceptInlineAddition( value, 5 );
			const html = result.toHTMLString();
			expect( html ).toBe( 'keep new text tail' );
			expect( html ).not.toContain( 'wp-suggestion' );
		} );

		it( 'only unwraps the targeted marker', () => {
			const value = RichTextData.fromHTMLString(
				`${ add( 1, 'one' ) } ${ add( 2, 'two' ) }`
			);
			const result = acceptInlineAddition( value, 1 );
			const html = result.toHTMLString();
			expect( html ).toContain( 'one' );
			expect( html ).not.toContain( 'data-suggestion-id="1"' );
			expect( html ).toContain( 'data-suggestion-id="2"' );
		} );

		it( 'returns a non-rich-text value unchanged', () => {
			expect( acceptInlineAddition( 'plain', 5 ) ).toBe( 'plain' );
		} );
	} );

	describe( 'rejectInlineAddition', () => {
		it( 'removes the proposed text and its marker', () => {
			const value = RichTextData.fromHTMLString(
				`keep ${ add( 5, 'discard me' ) } tail`
			);
			const result = rejectInlineAddition( value, 5 );
			expect( result.toHTMLString() ).toBe( 'keep  tail' );
		} );

		it( 'leaves other text and an unrelated marker intact', () => {
			const value = RichTextData.fromHTMLString(
				`${ add( 1, 'gone' ) } and ${ add( 2, 'stay' ) }`
			);
			const result = rejectInlineAddition( value, 1 );
			const html = result.toHTMLString();
			expect( html ).not.toContain( 'gone' );
			expect( html ).toContain( 'stay' );
			expect( html ).toContain( 'data-suggestion-id="2"' );
		} );

		it( 'returns the value unchanged when the marker is absent', () => {
			const value = RichTextData.fromHTMLString( 'no markers here' );
			expect( rejectInlineAddition( value, 99 ).toHTMLString() ).toBe(
				'no markers here'
			);
		} );
	} );

	describe( 'addition / deletion symmetry', () => {
		it( 'accepting an addition matches rejecting a deletion (unwrap)', () => {
			const additionAccepted = acceptInlineAddition(
				RichTextData.fromHTMLString( `x ${ add( 5, 'word' ) } y` ),
				5
			).toHTMLString();
			const deletionRejected = rejectInlineDeletion(
				RichTextData.fromHTMLString( `x ${ del( 5, 'word' ) } y` ),
				5
			).toHTMLString();
			expect( additionAccepted ).toBe( deletionRejected );
		} );

		it( 'rejecting an addition matches accepting a deletion (remove)', () => {
			const additionRejected = rejectInlineAddition(
				RichTextData.fromHTMLString( `x ${ add( 5, 'word' ) } y` ),
				5
			).toHTMLString();
			const deletionAccepted = acceptInlineDeletion(
				RichTextData.fromHTMLString( `x ${ del( 5, 'word' ) } y` ),
				5
			).toHTMLString();
			expect( additionRejected ).toBe( deletionAccepted );
		} );
	} );

	describe( 'insertInlineAddition', () => {
		// `applyFormat` emits marker attributes in a different order than the
		// `add()` helper string (data-* before class), so these assert on the
		// stripped text plus attribute presence rather than an exact HTML match.
		const stripTags = ( html ) => html.replace( /<[^>]+>/g, '' );

		it( 'inserts the text wrapped in an add marker at a caret', () => {
			const value = RichTextData.fromHTMLString( 'before after' );
			const result = insertInlineAddition( value, {
				text: 'NEW ',
				attributes: buildSuggestionMarkerAttributes( {
					id: 9,
					type: 'add',
				} ),
				start: 7,
				end: 7,
			} );
			const html = result.toHTMLString();
			expect( stripTags( html ) ).toBe( 'before NEW after' );
			expect( html ).toContain( 'class="wp-suggestion"' );
			expect( html ).toContain( 'data-suggestion-id="9"' );
			expect( html ).toContain( 'data-suggestion-type="add"' );
		} );

		it( 'replaces a selected range (type-over) with the marked text', () => {
			const value = RichTextData.fromHTMLString( 'keep OLD tail' );
			const result = insertInlineAddition( value, {
				text: 'NEW',
				attributes: buildSuggestionMarkerAttributes( {
					id: 3,
					type: 'add',
				} ),
				start: 5,
				end: 8,
			} );
			const html = result.toHTMLString();
			expect( stripTags( html ) ).toBe( 'keep NEW tail' );
			expect( html ).toContain( 'data-suggestion-id="3"' );
			expect( html ).toContain( 'data-suggestion-type="add"' );
			expect( html ).not.toContain( 'OLD' );
		} );

		it( 'defaults to appending at the end of the value', () => {
			const value = RichTextData.fromHTMLString( 'tail' );
			const result = insertInlineAddition( value, {
				text: '!',
				attributes: buildSuggestionMarkerAttributes( {
					id: 1,
					type: 'add',
				} ),
			} );
			const html = result.toHTMLString();
			expect( stripTags( html ) ).toBe( 'tail!' );
			expect( html ).toContain( 'data-suggestion-id="1"' );
			expect( html ).toContain( 'data-suggestion-type="add"' );
		} );

		it( 'is reversible: reject removes exactly the inserted run', () => {
			const value = RichTextData.fromHTMLString( 'before after' );
			const inserted = insertInlineAddition( value, {
				text: 'NEW ',
				attributes: buildSuggestionMarkerAttributes( {
					id: 9,
					type: 'add',
				} ),
				start: 7,
				end: 7,
			} );
			expect( rejectInlineAddition( inserted, 9 ).toHTMLString() ).toBe(
				'before after'
			);
		} );

		it( 'returns a non-rich-text value unchanged', () => {
			expect(
				insertInlineAddition( 'plain', { text: 'x', attributes: {} } )
			).toBe( 'plain' );
		} );

		it( 'returns the value unchanged when there is no text', () => {
			const value = RichTextData.fromHTMLString( 'unchanged' );
			expect(
				insertInlineAddition( value, {
					text: '',
					attributes: {},
				} ).toHTMLString()
			).toBe( 'unchanged' );
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
