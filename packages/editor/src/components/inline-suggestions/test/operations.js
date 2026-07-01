/**
 * WordPress dependencies
 */
import {
	RichTextData,
	registerFormatType,
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
	acceptInlineFormat,
	rejectInlineFormat,
	insertInlineAddition,
	growInlineAddition,
	buildSuggestionMarkerAttributes,
	formatsRangeHasSuggestion,
	valueRangeHasSuggestion,
} from '../operations';
import { registerSuggestionFormat, SUGGESTION_FORMAT_NAME } from '../format';

const getFormatType = ( name ) => select( richTextStore ).getFormatType( name );

const del = ( id, text ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="del">${ text }</mark>`;

const add = ( id, text ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="add">${ text }</mark>`;

const fmt = ( id, inner ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="format">${ inner }</mark>`;

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

	describe( 'growInlineAddition', () => {
		const stripTags = ( html ) => html.replace( /<[^>]+>/g, '' );
		const attrs = buildSuggestionMarkerAttributes( { id: 9, type: 'add' } );

		it( 'appends to the marker and keeps it a single run', () => {
			// Seed a one-char marker, then grow it one char at a time.
			let value = insertInlineAddition(
				RichTextData.fromHTMLString( 'before after' ),
				{ text: 'N', attributes: attrs, start: 7, end: 7 }
			);
			value = growInlineAddition( value, {
				text: 'E',
				attributes: attrs,
				markerStart: 7,
				markerEnd: 8,
			} );
			value = growInlineAddition( value, {
				text: 'W',
				attributes: attrs,
				markerStart: 7,
				markerEnd: 9,
			} );
			const html = value.toHTMLString();
			expect( stripTags( html ) ).toBe( 'before NEWafter' );
			// Re-stamping the whole span keeps one <mark>, not one per char.
			expect( html.match( /<mark/g ) ).toHaveLength( 1 );
			expect( html ).toContain( 'data-suggestion-id="9"' );
		} );

		it( 'leaves the grown run reversible via rejectInlineAddition', () => {
			let value = insertInlineAddition(
				RichTextData.fromHTMLString( 'x y' ),
				{ text: 'a', attributes: attrs, start: 2, end: 2 }
			);
			value = growInlineAddition( value, {
				text: 'b',
				attributes: attrs,
				markerStart: 2,
				markerEnd: 3,
			} );
			expect( rejectInlineAddition( value, 9 ).toHTMLString() ).toBe(
				'x y'
			);
		} );

		it( 'returns a non-rich-text value unchanged', () => {
			expect(
				growInlineAddition( 'plain', {
					text: 'x',
					attributes: attrs,
					markerStart: 0,
					markerEnd: 0,
				} )
			).toBe( 'plain' );
		} );

		it( 'returns the value unchanged when there is no text', () => {
			const value = RichTextData.fromHTMLString( 'unchanged' );
			expect(
				growInlineAddition( value, {
					text: '',
					attributes: attrs,
					markerStart: 0,
					markerEnd: 0,
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

describe( 'inline format operations', () => {
	beforeAll( () => {
		registerSuggestionFormat();
		if ( ! getFormatType( 'test/bold' ) ) {
			registerFormatType( 'test/bold', {
				title: 'Bold',
				tagName: 'strong',
				className: null,
				edit: () => null,
			} );
		}
	} );

	afterAll( () => {
		if ( getFormatType( 'test/bold' ) ) {
			unregisterFormatType( 'test/bold' );
		}
		if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	describe( 'acceptInlineFormat', () => {
		it( 'keeps the proposed formatting and drops the marker', () => {
			const value = RichTextData.fromHTMLString(
				`keep ${ fmt( 5, '<strong>word</strong>' ) } tail`
			);
			const result = acceptInlineFormat( value, 5 );
			const html = result.toHTMLString();
			expect( html ).toBe( 'keep <strong>word</strong> tail' );
			expect( html ).not.toContain( 'wp-suggestion' );
		} );

		it( 'returns a non-rich-text value unchanged', () => {
			expect( acceptInlineFormat( 'plain', 5 ) ).toBe( 'plain' );
		} );
	} );

	describe( 'rejectInlineFormat', () => {
		it( 'restores the original run from beforeHTML, dropping the marker', () => {
			const value = RichTextData.fromHTMLString(
				`keep ${ fmt( 5, '<strong>word</strong>' ) } tail`
			);
			const result = rejectInlineFormat( value, 5, 'word' );
			const html = result.toHTMLString();
			expect( html ).toBe( 'keep word tail' );
			expect( html ).not.toContain( '<strong>' );
			expect( html ).not.toContain( 'wp-suggestion' );
		} );

		it( 'restores an original that itself carried formatting (unbold case)', () => {
			// Proposed = plain "word"; original was bold. Reject brings bold back.
			const value = RichTextData.fromHTMLString(
				`a ${ fmt( 6, 'word' ) } b`
			);
			const result = rejectInlineFormat(
				value,
				6,
				'<strong>word</strong>'
			);
			expect( result.toHTMLString() ).toBe( 'a <strong>word</strong> b' );
		} );

		it( 'leaves an unrelated marker intact', () => {
			const value = RichTextData.fromHTMLString(
				`${ fmt( 1, '<strong>one</strong>' ) } and ${ add( 2, 'two' ) }`
			);
			const result = rejectInlineFormat( value, 1, 'one' );
			const html = result.toHTMLString();
			expect( html ).toContain( 'data-suggestion-id="2"' );
			expect( html ).not.toContain( 'data-suggestion-id="1"' );
		} );

		it( 'returns the value unchanged when the marker is absent', () => {
			const value = RichTextData.fromHTMLString( 'no markers here' );
			expect( rejectInlineFormat( value, 99, 'x' ).toHTMLString() ).toBe(
				'no markers here'
			);
		} );

		it( 'returns a non-rich-text value unchanged', () => {
			expect( rejectInlineFormat( 'plain', 5, 'x' ) ).toBe( 'plain' );
		} );
	} );
} );

describe( 'suggestion range overlap detection', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	describe( 'valueRangeHasSuggestion', () => {
		it( 'detects a range fully inside a marker', () => {
			// "abc" + marked "def" + "ghi": characters 3-5 sit in the marker.
			const value = RichTextData.fromHTMLString(
				`abc${ del( 1, 'def' ) }ghi`
			);
			expect( valueRangeHasSuggestion( value, 4, 5 ) ).toBe( true );
		} );

		it( 'detects a range partially overlapping a marker', () => {
			const value = RichTextData.fromHTMLString(
				`abc${ add( 1, 'def' ) }ghi`
			);
			// [1, 4) covers "bc" plus the marker's first character.
			expect( valueRangeHasSuggestion( value, 1, 4 ) ).toBe( true );
			// [5, 8) covers the marker's last character plus "gh".
			expect( valueRangeHasSuggestion( value, 5, 8 ) ).toBe( true );
		} );

		it( 'rejects a range that only touches unmarked text', () => {
			const value = RichTextData.fromHTMLString(
				`abc${ del( 1, 'def' ) }ghi`
			);
			expect( valueRangeHasSuggestion( value, 0, 3 ) ).toBe( false );
			expect( valueRangeHasSuggestion( value, 6, 9 ) ).toBe( false );
		} );

		it( 'rejects when the value has no markers at all', () => {
			const value = RichTextData.fromHTMLString( 'plain text' );
			expect( valueRangeHasSuggestion( value, 0, 5 ) ).toBe( false );
		} );

		it( 'ignores non-suggestion formats in the range', () => {
			const value = RichTextData.fromHTMLString(
				'a <strong>bold</strong> run'
			);
			expect( valueRangeHasSuggestion( value, 0, 8 ) ).toBe( false );
		} );

		it( 'accepts a plain-string value', () => {
			expect(
				valueRangeHasSuggestion( `x${ del( 9, 'yz' ) }`, 1, 2 )
			).toBe( true );
			expect( valueRangeHasSuggestion( 'plain', 0, 3 ) ).toBe( false );
		} );

		it( 'tolerates non-string, non-rich values and empty ranges', () => {
			expect( valueRangeHasSuggestion( undefined, 0, 1 ) ).toBe( false );
			expect( valueRangeHasSuggestion( 42, 0, 1 ) ).toBe( false );
			const value = RichTextData.fromHTMLString( del( 1, 'abc' ) );
			expect( valueRangeHasSuggestion( value, 2, 2 ) ).toBe( false );
		} );
	} );

	describe( 'formatsRangeHasSuggestion', () => {
		it( 'clamps out-of-bounds ranges', () => {
			const stack = [ { type: SUGGESTION_FORMAT_NAME } ];
			const formats = [ undefined, stack, stack ];
			expect( formatsRangeHasSuggestion( formats, -5, 1 ) ).toBe( false );
			expect( formatsRangeHasSuggestion( formats, 1, 99 ) ).toBe( true );
		} );

		it( 'tolerates a missing formats array', () => {
			expect( formatsRangeHasSuggestion( undefined, 0, 1 ) ).toBe(
				false
			);
		} );
	} );
} );
