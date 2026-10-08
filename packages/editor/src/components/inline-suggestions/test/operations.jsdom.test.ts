import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	RichTextData,
	registerFormatType,
	store as richTextStore,
	unregisterFormatType,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import {
	acceptInlineDeletion,
	rejectInlineDeletion,
	acceptInlineAddition,
	rejectInlineAddition,
	acceptInlineReplacement,
	rejectInlineReplacement,
	findAdditionRange,
	removeInlineAdditionRange,
	reviseOwnAddition,
	deleteAcrossOwnMarkers,
	acceptInlineFormat,
	rejectInlineFormat,
	insertInlineAddition,
	growInlineAddition,
	buildSuggestionMarkerAttributes,
	formatsRangeHasSuggestion,
	valueRangeHasSuggestion,
	formatsAdditionRunToExtend,
	valueAdditionRunToExtend,
} from '../operations';
import {
	registerSuggestionFormat,
	findSuggestionText,
	SUGGESTION_FORMAT_NAME,
} from '../format';

const getFormatType = ( name: string ) =>
	( select( richTextStore as any ) as any ).getFormatType( name );

const del = ( id: number | string, text: string ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="del">${ text }</mark>`;

const add = ( id: number | string, text: string ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="add">${ text }</mark>`;

const fmt = ( id: number | string, inner: string ) =>
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

		it( 'spares another marker interleaved inside a fragmented run', () => {
			/*
			 * The target marker is fragmented (same id split in two) with a
			 * DIFFERENT suggestion's marker in the gap. The resolved range
			 * spans first -> last hit of the id, but accepting the deletion
			 * must remove only the characters carrying the target id — never
			 * the inner marker's text.
			 */
			const value = RichTextData.fromHTMLString(
				`${ del( 1, 'AB' ) }${ add( 2, 'IN' ) }${ del( 1, 'CD' ) }`
			);
			const result = acceptInlineDeletion( value, 1 );
			const html = result.toHTMLString();
			expect( html ).not.toContain( 'AB' );
			expect( html ).not.toContain( 'CD' );
			expect( html ).toContain( 'IN' );
			expect( html ).toContain( 'data-suggestion-id="2"' );
			expect( html ).not.toContain( 'data-suggestion-id="1"' );
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

	describe( 'acceptInlineAddition with an interleaved marker', () => {
		it( 'keeps another suggestion that sits in the gap of a fragmented run', () => {
			const value = RichTextData.fromHTMLString(
				`${ add( 1, 'A' ) }${ add( 2, 'B' ) }${ add( 1, 'C' ) }`
			);
			const html = acceptInlineAddition( value, 1 ).toHTMLString();
			expect( html.replace( /<[^>]+>/g, '' ) ).toBe( 'ABC' );
			expect( html ).toContain( 'data-suggestion-id="2"' );
			expect( html ).not.toContain( 'data-suggestion-id="1"' );
		} );
	} );

	describe( 'rejectInlineDeletion with an interleaved marker', () => {
		it( 'keeps another suggestion that sits in the gap of a fragmented run', () => {
			const value = RichTextData.fromHTMLString(
				`${ del( 1, 'A' ) }${ add( 2, 'B' ) }${ del( 1, 'C' ) }`
			);
			const html = rejectInlineDeletion( value, 1 ).toHTMLString();
			expect( html.replace( /<[^>]+>/g, '' ) ).toBe( 'ABC' );
			expect( html ).toContain( 'data-suggestion-id="2"' );
			expect( html ).not.toContain( 'data-suggestion-id="1"' );
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

		it( 'spares another marker interleaved inside a fragmented run', () => {
			// Mirror of the acceptInlineDeletion interleaved case: rejecting
			// the fragmented addition removes only its own characters.
			const value = RichTextData.fromHTMLString(
				`${ add( 3, 'AB' ) }${ del( 4, 'IN' ) }${ add( 3, 'CD' ) }`
			);
			const result = rejectInlineAddition( value, 3 );
			const html = result.toHTMLString();
			expect( html ).not.toContain( 'AB' );
			expect( html ).not.toContain( 'CD' );
			expect( html ).toContain( 'IN' );
			expect( html ).toContain( 'data-suggestion-id="4"' );
			expect( html ).not.toContain( 'data-suggestion-id="3"' );
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
		const stripTags = ( html: string ) => html.replace( /<[^>]+>/g, '' );

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

		it( 'keeps the inline formatting of a rich run (bold and a link)', () => {
			const value = RichTextData.fromHTMLString( 'before  after' );
			const result = insertInlineAddition( value, {
				html: 'rich <strong>bold</strong> and <a href="https://example.com">a link</a>',
				attributes: buildSuggestionMarkerAttributes( {
					id: 7,
					type: 'add',
				} ),
				start: 7,
				end: 7,
			} );
			const html = result.toHTMLString();
			expect( stripTags( html ) ).toBe(
				'before rich bold and a link after'
			);
			expect( html ).toContain( '<strong>bold</strong>' );
			expect( html ).toContain( '<a href="https://example.com">' );
			expect( html ).toContain( 'data-suggestion-id="7"' );
		} );

		it( 'wraps a rich run in exactly one marker', () => {
			const value = RichTextData.fromHTMLString( '' );
			const result = insertInlineAddition( value, {
				html: '<strong>all</strong> <em>formatted</em>',
				attributes: buildSuggestionMarkerAttributes( {
					id: 8,
					type: 'add',
				} ),
			} );
			const html = result.toHTMLString();
			expect( html.match( /<mark/g ) ).toHaveLength( 1 );
			// The marker is the outermost tag, so accept/reject resolve the
			// whole run rather than one fragment of it.
			expect( html.startsWith( '<mark' ) ).toBe( true );
		} );

		it( 'is reversible for a rich run: reject removes it entirely', () => {
			const value = RichTextData.fromHTMLString( 'before after' );
			const inserted = insertInlineAddition( value, {
				html: '<strong>NEW</strong> ',
				attributes: buildSuggestionMarkerAttributes( {
					id: 4,
					type: 'add',
				} ),
				start: 7,
				end: 7,
			} );
			expect( rejectInlineAddition( inserted, 4 ).toHTMLString() ).toBe(
				'before after'
			);
		} );

		it( 'leaves the rich run behind when the addition is accepted', () => {
			const value = RichTextData.fromHTMLString( 'before after' );
			const inserted = insertInlineAddition( value, {
				html: '<a href="https://example.com">link</a> ',
				attributes: buildSuggestionMarkerAttributes( {
					id: 6,
					type: 'add',
				} ),
				start: 7,
				end: 7,
			} );
			expect( acceptInlineAddition( inserted, 6 ).toHTMLString() ).toBe(
				'before <a href="https://example.com">link</a> after'
			);
		} );
	} );

	describe( 'growInlineAddition', () => {
		const stripTags = ( html: string ) => html.replace( /<[^>]+>/g, '' );
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

		it( "keeps a pasted run's formatting inside the grown marker", () => {
			// A rich-text paste landing strictly inside the author's own
			// pending addition grows that marker rather than nesting a second
			// one in it, and the pasted formatting survives the grow.
			const value = growInlineAddition(
				RichTextData.fromHTMLString( `Hello ${ add( 9, 'ADDED' ) }` ),
				{
					text: 'bold',
					html: '<strong>bold</strong>',
					attributes: attrs,
					markerStart: 6,
					markerEnd: 11,
					at: 9,
				}
			);
			const html = value.toHTMLString();
			expect( stripTags( html ) ).toBe( 'Hello ADDboldED' );
			// One marker wrapping the whole proposal, with the pasted format
			// nested inside it rather than the other way round.
			expect( html.match( /<mark/g ) ).toHaveLength( 1 );
			expect( html ).toContain( '<strong>bold</strong>' );
			expect( findSuggestionText( value, 9 ) ).toBe( 'ADDboldED' );
			expect( rejectInlineAddition( value, 9 ).toHTMLString() ).toBe(
				'Hello '
			);
		} );

		it( 'inserts at `at` inside the marker, still as one run', () => {
			const value = growInlineAddition(
				RichTextData.fromHTMLString( `Hello ${ add( 9, 'ADDED' ) }` ),
				{
					text: 'XX',
					attributes: attrs,
					markerStart: 6,
					markerEnd: 11,
					at: 9,
				}
			);
			const html = value.toHTMLString();
			expect( stripTags( html ) ).toBe( 'Hello ADDXXED' );
			expect( html.match( /<mark/g ) ).toHaveLength( 1 );
			expect( findSuggestionText( value, 9 ) ).toBe( 'ADDXXED' );
			// Rejecting still restores the original text exactly.
			expect( rejectInlineAddition( value, 9 ).toHTMLString() ).toBe(
				'Hello '
			);
		} );

		it( 'clamps an `at` outside the marker into it', () => {
			const value = growInlineAddition(
				RichTextData.fromHTMLString( `Hello ${ add( 9, 'ADDED' ) }` ),
				{
					text: 'X',
					attributes: attrs,
					markerStart: 6,
					markerEnd: 11,
					at: 0,
				}
			);
			expect( stripTags( value.toHTMLString() ) ).toBe( 'Hello XADDED' );
			expect( findSuggestionText( value, 9 ) ).toBe( 'XADDED' );
		} );
	} );
} );

describe( 'formatsAdditionRunToExtend / valueAdditionRunToExtend', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	// A pending `add` marker authored by user 2.
	const mine = ( id: number | string, text: string ) =>
		`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="add" data-author="2">${ text }</mark>`;

	it( 'matches a caret inside the author own addition', () => {
		const value = RichTextData.fromHTMLString(
			`Hello ${ mine( 41, 'ADDED' ) }`
		);
		expect( valueAdditionRunToExtend( value, 9, '2' ) ).toEqual( {
			id: '41',
			start: 6,
			end: 11,
		} );
	} );

	it( 'matches a caret at the trailing edge', () => {
		const value = RichTextData.fromHTMLString(
			`Hello ${ mine( 41, 'ADDED' ) } tail`
		);
		expect( valueAdditionRunToExtend( value, 11, '2' ) ).toEqual( {
			id: '41',
			start: 6,
			end: 11,
		} );
	} );

	it( 'does not match a caret at the leading edge', () => {
		const value = RichTextData.fromHTMLString(
			`Hello ${ mine( 41, 'ADDED' ) }`
		);
		expect( valueAdditionRunToExtend( value, 6, '2' ) ).toBeNull();
	} );

	it( 'does not match another author addition', () => {
		const value = RichTextData.fromHTMLString(
			`Hello ${ mine( 41, 'ADDED' ) }`
		);
		expect( valueAdditionRunToExtend( value, 9, '7' ) ).toBeNull();
	} );

	it( 'does not match a deletion or a format marker', () => {
		expect(
			valueAdditionRunToExtend(
				RichTextData.fromHTMLString( del( 41, 'gone' ) ),
				2,
				null
			)
		).toBeNull();
		expect(
			valueAdditionRunToExtend(
				RichTextData.fromHTMLString(
					fmt( 41, '<strong>bold</strong>' )
				),
				2,
				null
			)
		).toBeNull();
	} );

	it( 'does not match a marker already fragmented across the value', () => {
		// The shape F-06 used to produce: one id, two disjoint <mark>s.
		const value = RichTextData.fromHTMLString(
			`${ mine( 41, 'ADD' ) }${ add( 42, 'XX' ) }${ mine( 41, 'ED' ) }`
		);
		expect( valueAdditionRunToExtend( value, 2, '2' ) ).toBeNull();
	} );

	it( 'does not match an own addition with another marker nested inside it', () => {
		// A collaborator proposed deleting part of this author's addition.
		// Growing would re-apply the outer marker over the run and strip the
		// nested one, orphaning its note.
		const value = RichTextData.fromHTMLString(
			`<mark class="wp-suggestion" data-suggestion-id="41" data-suggestion-type="add" data-author="2">out${ del(
				42,
				'in'
			) }</mark>`
		);
		expect( valueAdditionRunToExtend( value, 5, '2' ) ).toBeNull();
		expect( valueAdditionRunToExtend( value, 3, '2' ) ).toBeNull();
	} );

	it( 'returns null for unmarked text and non-rich values', () => {
		expect(
			valueAdditionRunToExtend(
				RichTextData.fromHTMLString( 'plain text' ),
				4,
				'2'
			)
		).toBeNull();
		expect( valueAdditionRunToExtend( undefined, 4, '2' ) ).toBeNull();
		expect( formatsAdditionRunToExtend( undefined, 4, '2' ) ).toBeNull();
	} );

	it( 'matches an unauthored marker when the editor author is unknown', () => {
		const value = RichTextData.fromHTMLString( add( 41, 'ADDED' ) );
		expect( valueAdditionRunToExtend( value, 3, null ) ).toEqual( {
			id: '41',
			start: 0,
			end: 5,
		} );
	} );

	it( 'does not match an authored marker when the editor author is unknown', () => {
		const value = RichTextData.fromHTMLString( mine( 41, 'ADDED' ) );
		expect( valueAdditionRunToExtend( value, 3, null ) ).toBeNull();
		expect( valueAdditionRunToExtend( value, 3, undefined ) ).toBeNull();
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
			} as any );
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

		it( 'restores the original run in a plain-string value', () => {
			const html = `keep ${ fmt( 5, '<strong>word</strong>' ) } tail`;
			expect( rejectInlineFormat( html, 5, 'word' ).toHTMLString() ).toBe(
				'keep word tail'
			);
		} );

		it( 'returns a string carrying no marker unchanged', () => {
			expect( rejectInlineFormat( 'plain', 5, 'x' ) ).toBe( 'plain' );
		} );

		it( 'returns a value that is neither rich text nor a string unchanged', () => {
			const value = { nope: true };
			expect( rejectInlineFormat( value, 5, 'x' ) ).toBe( value );
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

describe( 'inline replacement operations', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	// A type-over: the new text, then the replaced text, under one id.
	const mine = ( id: number | string, text: string ) =>
		`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="add" data-author="2">${ text }</mark>`;
	const replaced = `This is ${ mine( 7, 'my' ) }${ del(
		7,
		'your'
	) } first doc`;

	it( 'accepting keeps the new text and drops the replaced text', () => {
		const value = RichTextData.fromHTMLString( replaced );
		expect( acceptInlineReplacement( value, 7 ).toHTMLString() ).toBe(
			'This is my first doc'
		);
	} );

	it( 'rejecting keeps the replaced text and drops the new text', () => {
		const value = RichTextData.fromHTMLString( replaced );
		expect( rejectInlineReplacement( value, 7 ).toHTMLString() ).toBe(
			'This is your first doc'
		);
	} );

	it( 'accepting a deletion leaves the shared-id addition alone', () => {
		const value = RichTextData.fromHTMLString( replaced );
		const result = acceptInlineDeletion( value, 7 );
		expect( findSuggestionText( result, 7 ) ).toBe( 'my' );
	} );

	it( 'quotes each side by type', () => {
		const value = RichTextData.fromHTMLString( replaced );
		expect( findSuggestionText( value, 7, 'add' ) ).toBe( 'my' );
		expect( findSuggestionText( value, 7, 'del' ) ).toBe( 'your' );
	} );

	it( 'extends only the add run, not the shared-id del run', () => {
		const value = RichTextData.fromHTMLString( replaced );
		// Caret after "my" (offset 10).
		expect( valueAdditionRunToExtend( value, 10, '2' ) ).toEqual( {
			id: '7',
			start: 8,
			end: 10,
		} );
		expect( findAdditionRange( value, 7 ) ).toEqual( {
			start: 8,
			end: 10,
		} );
	} );

	it( 'growing the add run keeps the del run a deletion', () => {
		const value = RichTextData.fromHTMLString( replaced );
		const grown = growInlineAddition( value, {
			text: 'y',
			attributes: buildSuggestionMarkerAttributes( {
				id: 7,
				type: 'add',
				authorId: 2,
			} ),
			markerStart: 8,
			markerEnd: 10,
		} );
		expect( findSuggestionText( grown, 7, 'add' ) ).toBe( 'myy' );
		expect( findSuggestionText( grown, 7, 'del' ) ).toBe( 'your' );
	} );

	it( 'removes characters from a pending addition', () => {
		const value = RichTextData.fromHTMLString( replaced );
		const shrunk = removeInlineAdditionRange( value, 9, 10 );
		expect( findSuggestionText( shrunk, 7, 'add' ) ).toBe( 'm' );
		expect( findSuggestionText( shrunk, 7, 'del' ) ).toBe( 'your' );
		expect( shrunk.text ).toBe( 'This is myour first doc' );
	} );
} );

describe( 'reviseOwnAddition', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	const addBy = ( id: number, author: number, text: string ) =>
		`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="add" data-author="${ author }">${ text }</mark>`;

	it( 'replaces a selection inside the addition within the same marker', () => {
		// "Hello wrold": select "ro" (offsets 7-9) and type "or".
		const value = RichTextData.fromHTMLString(
			`Hello${ addBy( 4, 1, ' wrold' ) }`
		);
		const result = reviseOwnAddition( value, {
			start: 7,
			end: 9,
			text: 'or',
			authorToken: '1',
		} );
		expect( result ).toMatchObject( {
			id: '4',
			markerStart: 5,
			markerEnd: 11,
			caret: 9,
			isReplacement: false,
		} );
		expect( result!.value.text ).toBe( 'Hello world' );
		expect( findSuggestionText( result!.value, 4, 'add' ) ).toBe(
			' world'
		);
		expect( result!.value.toHTMLString().match( /<mark/g ) ).toHaveLength(
			1
		);
	} );

	it( 'replaces the whole addition when it is all selected', () => {
		const value = RichTextData.fromHTMLString(
			`Hello${ addBy( 4, 1, ' wrold' ) }`
		);
		const result = reviseOwnAddition( value, {
			start: 5,
			end: 11,
			text: '!',
			authorToken: '1',
		} );
		expect( result!.value.text ).toBe( 'Hello!' );
		expect( findSuggestionText( result!.value, 4, 'add' ) ).toBe( '!' );
		expect( result!.caret ).toBe( 6 );
	} );

	it( 'marks original text before the addition for deletion under the same id', () => {
		// Select "lo wr" (offsets 3-8) and type "p wr".
		const value = RichTextData.fromHTMLString(
			`Hello${ addBy( 4, 1, ' wrold' ) }`
		);
		const result = reviseOwnAddition( value, {
			start: 3,
			end: 8,
			text: 'p wr',
			authorToken: '1',
		} );
		expect( result ).toMatchObject( {
			markerStart: 5,
			markerEnd: 12,
			caret: 9,
			isReplacement: true,
		} );
		expect( findSuggestionText( result!.value, 4, 'del' ) ).toBe( 'lo' );
		expect( findSuggestionText( result!.value, 4, 'add' ) ).toBe(
			'p wrold'
		);
		expect( result!.value.text ).toBe( 'Hellop wrold' );
		// The deletion keeps the addition's author.
		const deletionTag = result!.value
			.toHTMLString()
			.match( /<mark[^>]*data-suggestion-type="del"[^>]*>/ )![ 0 ];
		expect( deletionTag ).toContain( 'data-author="1"' );
	} );

	it( 'marks original text after the addition for deletion under the same id', () => {
		// "a NEW b": select "W b" (offsets 4-7) and type "w".
		const value = RichTextData.fromHTMLString(
			`a${ addBy( 4, 1, ' NEW' ) } b`
		);
		const result = reviseOwnAddition( value, {
			start: 4,
			end: 7,
			text: 'w',
			authorToken: '1',
		} );
		expect( result ).toMatchObject( {
			markerStart: 1,
			markerEnd: 5,
			caret: 5,
			isReplacement: true,
		} );
		expect( findSuggestionText( result!.value, 4, 'add' ) ).toBe( ' NEw' );
		expect( findSuggestionText( result!.value, 4, 'del' ) ).toBe( ' b' );
		expect( result!.value.text ).toBe( 'a NEw b' );
	} );

	it( 'declines another author’s addition', () => {
		const value = RichTextData.fromHTMLString(
			`Hello${ addBy( 4, 2, ' wrold' ) }`
		);
		expect(
			reviseOwnAddition( value, {
				start: 7,
				end: 9,
				text: 'or',
				authorToken: '1',
			} )
		).toBeNull();
	} );

	it( 'declines a selection with original text on both sides', () => {
		const value = RichTextData.fromHTMLString(
			`a${ addBy( 4, 1, ' NEW' ) } b`
		);
		expect(
			reviseOwnAddition( value, {
				start: 0,
				end: 7,
				text: 'x',
				authorToken: '1',
			} )
		).toBeNull();
	} );

	it( 'declines when the original part carries another suggestion', () => {
		const value = RichTextData.fromHTMLString(
			`He${ del( 9, 'll' ) }o${ addBy( 4, 1, ' wrold' ) }`
		);
		expect(
			reviseOwnAddition( value, {
				start: 2,
				end: 8,
				text: 'x',
				authorToken: '1',
			} )
		).toBeNull();
	} );

	it( 'declines straddling a replacement that already owns a deletion', () => {
		const value = RichTextData.fromHTMLString(
			`Hi ${ addBy( 4, 1, 'new' ) }<mark class="wp-suggestion" data-suggestion-id="4" data-suggestion-type="del" data-author="1">old</mark>`
		);
		expect(
			reviseOwnAddition( value, {
				start: 1,
				end: 4,
				text: 'x',
				authorToken: '1',
			} )
		).toBeNull();
		// Inside the replacement's addition is still a revision.
		const inside = reviseOwnAddition( value, {
			start: 3,
			end: 6,
			text: 'fresh',
			authorToken: '1',
		} );
		expect( findSuggestionText( inside!.value, 4, 'add' ) ).toBe( 'fresh' );
		expect( findSuggestionText( inside!.value, 4, 'del' ) ).toBe( 'old' );
	} );

	it( 'declines a selection outside any addition', () => {
		const value = RichTextData.fromHTMLString(
			`Hello${ addBy( 4, 1, ' wrold' ) }`
		);
		expect(
			reviseOwnAddition( value, {
				start: 0,
				end: 3,
				text: 'x',
				authorToken: '1',
			} )
		).toBeNull();
	} );
} );

describe( 'deleteAcrossOwnMarkers', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	const mark = ( id: number, type: string, author: number, text: string ) =>
		`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="${ type }" data-author="${ author }">${ text }</mark>`;

	it( 'removes own additions and keeps own deletions', () => {
		// "Hi " (add) "Hello" (del) " there" (add).
		const value = RichTextData.fromHTMLString(
			`${ mark( 3, 'add', 1, 'Hi ' ) }${ mark(
				2,
				'del',
				1,
				'Hello'
			) }${ mark( 4, 'add', 1, ' there' ) } world`
		);
		const result = deleteAcrossOwnMarkers( value, 0, 14, '1' );
		expect( result!.deletion ).toBeNull();
		expect( result!.value.text ).toBe( 'Hello world' );
		expect( findSuggestionText( result!.value, 2, 'del' ) ).toBe( 'Hello' );
		expect( result!.value.toHTMLString().match( /<mark/g ) ).toHaveLength(
			1
		);
	} );

	it( 'returns the original text left between them as one range', () => {
		// "Hi " (add) "Hello" (del) " world" " NEW" (add).
		const value = RichTextData.fromHTMLString(
			`${ mark( 3, 'add', 1, 'Hi ' ) }${ mark(
				2,
				'del',
				1,
				'Hello'
			) } world${ mark( 4, 'add', 1, ' NEW' ) }`
		);
		const result = deleteAcrossOwnMarkers( value, 0, 18, '1' );
		expect( result!.value.text ).toBe( 'Hello world' );
		expect( result!.deletion ).toEqual( { start: 5, end: 11 } );
	} );

	it( 'joins original text on both sides of a removed addition', () => {
		const value = RichTextData.fromHTMLString(
			`The quick${ mark( 4, 'add', 1, ' very' ) } brown fox`
		);
		// Select "quick very brown".
		const result = deleteAcrossOwnMarkers( value, 4, 20, '1' );
		expect( result!.value.text ).toBe( 'The quick brown fox' );
		expect( result!.deletion ).toEqual( { start: 4, end: 15 } );
	} );

	it( 'declines when original text sits on both sides of a kept deletion', () => {
		const value = RichTextData.fromHTMLString(
			`ab${ mark( 2, 'del', 1, 'cd' ) }ef`
		);
		expect( deleteAcrossOwnMarkers( value, 1, 5, '1' ) ).toBeNull();
	} );

	it( 'declines a range with no marker, or with another author’s', () => {
		const value = RichTextData.fromHTMLString(
			`ab${ mark( 2, 'add', 9, 'cd' ) }ef`
		);
		expect( deleteAcrossOwnMarkers( value, 0, 2, '1' ) ).toBeNull();
		expect( deleteAcrossOwnMarkers( value, 1, 5, '1' ) ).toBeNull();
	} );

	it( 'declines a range touching a format marker', () => {
		const value = RichTextData.fromHTMLString(
			`ab${ mark( 2, 'format', 1, '<strong>cd</strong>' ) }ef`
		);
		expect( deleteAcrossOwnMarkers( value, 1, 5, '1' ) ).toBeNull();
	} );
} );
