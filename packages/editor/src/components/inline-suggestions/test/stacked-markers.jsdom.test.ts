/**
 * Stacked markers of one kind: an addition typed inside someone's addition
 * nests in it, and two people can propose deleting the same words. Each
 * suggestion keeps its own `<mark>`, in a canonical order, and resolves on
 * its own (#73411, overlapping suggestions).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RichTextData, create } from '@wordpress/rich-text';
import {
	addSuggestionMarker,
	findSuggestionText,
	registerSuggestionFormat,
	removeSuggestionMarker,
	suggestionMarkerListsAt,
	suggestionMarkerId,
	unregisterSuggestionFormats,
} from '../format';
import {
	acceptInlineAddition,
	buildSuggestionMarkerAttributes,
	growInlineAddition,
	insertInlineAddition,
	valueAdditionRunToExtend,
	wrapSuggestionMarker,
} from '../operations';
import { resolveInlineSuggestion } from '../resolution';
import { settleInsertedSuggestionMarkers } from '../strip-markers';

const mark = (
	kind: 'add' | 'del' | 'format',
	id: number,
	inner: string,
	author = id
) =>
	`<mark data-suggestion-id="${ id }" data-suggestion-type="${ kind }" data-author="${ author }" class="wp-suggestion-${ kind }">${ inner }</mark>`;

const rtd = ( html: string ) => RichTextData.fromHTMLString( html );

const marker = ( kind: 'add' | 'del', id: number, authorId = id ) => ( {
	type: `core/suggestion-${ kind }`,
	attributes: buildSuggestionMarkerAttributes( { id, type: kind, authorId } ),
} );

const idsAt = ( value: any, index: number, kind: 'add' | 'del' ) =>
	suggestionMarkerListsAt( value.formats[ index ] )[ kind ].map(
		suggestionMarkerId
	);

describe( 'stacked markers', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
	} );

	describe( 'stack primitives', () => {
		it( 'adds a marker of a kind already on the text without replacing it', () => {
			const record = addSuggestionMarker(
				create( { html: `a${ mark( 'del', 7, 'bcd' ) }e` } ),
				marker( 'del', 9 ),
				2,
				4
			);
			expect( idsAt( record, 1, 'del' ) ).toEqual( [ '7' ] );
			expect( idsAt( record, 2, 'del' ) ).toEqual( [ '7', '9' ] );
		} );

		it( 'orders a kind’s markers by id, oldest outermost, whatever the write order', () => {
			const record = addSuggestionMarker(
				create( { html: `a${ mark( 'del', 9, 'bc' ) }d` } ),
				marker( 'del', 7 ),
				1,
				3
			);
			expect( new RichTextData( record as any ).toHTMLString() ).toBe(
				`a${ mark( 'del', 7, mark( 'del', 9, 'bc' ) ) }d`
			);
		} );

		it( 'removes one suggestion’s marker and leaves the other', () => {
			const record = removeSuggestionMarker(
				create( {
					html: `a${ mark( 'del', 7, mark( 'del', 9, 'bc' ) ) }d`,
				} ),
				'del',
				9,
				0,
				4
			);
			expect( new RichTextData( record as any ).toHTMLString() ).toBe(
				`a${ mark( 'del', 7, 'bc' ) }d`
			);
		} );
	} );

	describe( 'nested additions', () => {
		// Anne (10) proposed " quick"; Bob (11) types inside it.
		const base = () => rtd( `The${ mark( 'add', 10, ' quick' ) } fox.` );

		const nested = () =>
			insertInlineAddition( base(), {
				text: 'ly',
				attributes: marker( 'add', 11 ).attributes,
				start: 6,
			} );

		it( 'nests text typed inside another addition in it', () => {
			expect( nested().toHTMLString() ).toBe(
				`The${ mark(
					'add',
					10,
					` qu${ mark( 'add', 11, 'ly' ) }ick`
				) } fox.`
			);
			expect( findSuggestionText( nested(), 10 ) ).toBe( ' qulyick' );
		} );

		it( 'grows the nested addition inside the outer one', () => {
			const run = valueAdditionRunToExtend( nested(), 8, '11' );
			expect( run ).toEqual( { id: '11', start: 6, end: 8 } );
			const grown = growInlineAddition( nested(), {
				text: 'z',
				attributes: marker( 'add', 11 ).attributes,
				markerStart: run!.start,
				markerEnd: run!.end,
				at: 8,
			} );
			expect( findSuggestionText( grown, 11 ) ).toBe( 'lyz' );
			expect( idsAt( grown, 8, 'add' ) ).toEqual( [ '10', '11' ] );
			expect( findSuggestionText( grown, 10 ) ).toBe( ' qulyzick' );
		} );

		it( 'grows the outer addition around the nested one', () => {
			const run = valueAdditionRunToExtend( nested(), 11, '10' );
			expect( run ).toEqual( { id: '10', start: 3, end: 11 } );
			const grown = growInlineAddition( nested(), {
				text: '!',
				attributes: marker( 'add', 10 ).attributes,
				markerStart: run!.start,
				markerEnd: run!.end,
			} );
			expect( findSuggestionText( grown, 10 ) ).toBe( ' qulyick!' );
			expect( findSuggestionText( grown, 11 ) ).toBe( 'ly' );
		} );

		it( 'keeps the nested addition pending when the outer one is accepted', () => {
			const value = acceptInlineAddition( nested(), 10 );
			expect( value.toHTMLString() ).toBe(
				`The qu${ mark( 'add', 11, 'ly' ) }ick fox.`
			);
		} );

		it( 'keeps the outer addition pending when the nested one is accepted', () => {
			const value = acceptInlineAddition( nested(), 11 );
			expect( value.toHTMLString() ).toBe(
				`The${ mark( 'add', 10, ' qulyick' ) } fox.`
			);
		} );

		it( 'empties the nested addition when the outer one is rejected', () => {
			const effect = resolveInlineSuggestion( nested(), {
				id: 10,
				suggestionType: 'add',
				decision: 'reject',
			} );
			expect( effect.value.toHTMLString() ).toBe( 'The fox.' );
			expect( effect.affected.get( '11' ) ).toBe( 'emptied' );
		} );

		it( 'shrinks the outer addition when the nested one is rejected', () => {
			const effect = resolveInlineSuggestion( nested(), {
				id: 11,
				suggestionType: 'add',
				decision: 'reject',
			} );
			expect( effect.value.toHTMLString() ).toBe( base().toHTMLString() );
			expect( effect.affected.get( '10' ) ).toBe( 'shrunk' );
		} );

		it( 'drops another author’s nested text when settling, even inside one’s own', () => {
			// Anne's own addition with Bob's nested in it, settled for Anne.
			const { value } = settleInsertedSuggestionMarkers( nested(), 10 );
			expect( value.toHTMLString() ).toBe( 'The quick fox.' );
		} );
	} );

	describe( 'two deletions of the same words', () => {
		// "one two three": Anne (7) deletes "two three", Bob (9) "one two".
		const both = () => {
			let value: any = rtd( 'one two three' );
			value = wrapSuggestionMarker( value, {
				kind: 'del',
				attributes: marker( 'del', 7 ).attributes,
				start: 4,
				end: 13,
			} );
			return wrapSuggestionMarker( value, {
				kind: 'del',
				attributes: marker( 'del', 9 ).attributes,
				start: 0,
				end: 7,
			} )!;
		};

		it( 'keeps both, the shared words carrying both ids', () => {
			expect( findSuggestionText( both(), 7 ) ).toBe( 'two three' );
			expect( findSuggestionText( both(), 9 ) ).toBe( 'one two' );
			expect( idsAt( both(), 5, 'del' ) ).toEqual( [ '7', '9' ] );
		} );

		it( 'shrinks the other deletion when one is accepted', () => {
			const effect = resolveInlineSuggestion( both(), {
				id: 9,
				suggestionType: 'del',
				decision: 'accept',
			} );
			expect( effect.value.toHTMLString() ).toBe(
				mark( 'del', 7, ' three' )
			);
			expect( effect.affected.get( '7' ) ).toBe( 'shrunk' );
		} );

		it( 'leaves the other deletion whole when one is rejected', () => {
			const effect = resolveInlineSuggestion( both(), {
				id: 9,
				suggestionType: 'del',
				decision: 'reject',
			} );
			expect( effect.value.toHTMLString() ).toBe(
				`one ${ mark( 'del', 7, 'two three' ) }`
			);
			expect( effect.affected.size ).toBe( 0 );
		} );

		it( 'empties a deletion wholly inside one that is accepted', () => {
			const value = wrapSuggestionMarker( rtd( 'abcdef' ), {
				kind: 'del',
				attributes: marker( 'del', 7 ).attributes,
				start: 1,
				end: 5,
			} );
			const stacked = wrapSuggestionMarker( value, {
				kind: 'del',
				attributes: marker( 'del', 9 ).attributes,
				start: 2,
				end: 4,
			} );
			const effect = resolveInlineSuggestion( stacked, {
				id: 7,
				suggestionType: 'del',
				decision: 'accept',
			} );
			expect( effect.value.toHTMLString() ).toBe( 'af' );
			expect( effect.affected.get( '9' ) ).toBe( 'emptied' );
		} );
	} );
} );
