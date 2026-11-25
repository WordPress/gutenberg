/**
 * The RTC guard: content merged from a peer can carry stacked markers in
 * whatever order the merge produced, or a marker whose id changed under a
 * last-writer-wins attribute merge. The guard puts stacks in canonical order
 * and restores swapped ids the same way on every peer, so they converge.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RichTextData, create } from '@wordpress/rich-text';
import {
	registerSuggestionFormat,
	unregisterSuggestionFormats,
	findSuggestionText,
} from '../format';
import {
	guardMarkerIntegrity,
	guardSyncedValue,
	isCanonicalSuggestionStack,
	normalizeSuggestionMarkers,
} from '../marker-integrity';

const mark = (
	kind: 'add' | 'del' | 'format',
	id: number,
	inner: string,
	author = id
) =>
	`<mark data-suggestion-id="${ id }" data-suggestion-type="${ kind }" data-author="${ author }" class="wp-suggestion-${ kind }">${ inner }</mark>`;

const normalizeHTML = ( html: string ) =>
	new RichTextData(
		normalizeSuggestionMarkers( create( { html } ) ) as any
	).toHTMLString();

describe( 'marker integrity', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
	} );

	describe( 'normalizeSuggestionMarkers', () => {
		it( 'keeps both same-kind markers, the older one outermost', () => {
			const merged = `a${ mark(
				'add',
				15,
				`bc${ mark( 'add', 12, 'de' ) }f`
			) }g`;
			const html = normalizeHTML( merged );
			const value = RichTextData.fromHTMLString( html );
			expect( findSuggestionText( value, 12 ) ).toBe( 'de' );
			expect( findSuggestionText( value, 15 ) ).toBe( 'bcdef' );
			expect( html ).toBe(
				`a${ mark( 'add', 15, 'bc' ) }${ mark(
					'add',
					12,
					mark( 'add', 15, 'de' )
				) }${ mark( 'add', 15, 'f' ) }g`
			);
		} );

		it( 'keeps crossing deletions by two authors', () => {
			// Peer one wrapped "bcd" in 21, peer two "cde" in 20; the HTML merge
			// nests them.
			const merged = `a${ mark( 'del', 21, `b${ mark( 'del', 20, 'cd' ) }` ) }${ mark(
				'del',
				20,
				'e'
			) }f`;
			const value = RichTextData.fromHTMLString(
				normalizeHTML( merged )
			);
			expect( findSuggestionText( value, 20 ) ).toBe( 'cde' );
			expect( findSuggestionText( value, 21 ) ).toBe( 'bcd' );
		} );

		it( 'keeps one marker when a merge repeats it on a character', () => {
			const merged = `a${ mark( 'del', 20, mark( 'del', 20, 'bc' ) ) }d`;
			expect( normalizeHTML( merged ) ).toBe(
				`a${ mark( 'del', 20, 'bc' ) }d`
			);
		} );

		it( 'converges whichever way the merge nested the markers', () => {
			const one = `a${ mark(
				'del',
				21,
				`b${ mark( 'del', 20, 'cd' ) }`
			) }${ mark( 'del', 20, 'e' ) }f`;
			const two = `a${ mark( 'del', 21, 'b' ) }${ mark(
				'del',
				20,
				`${ mark( 'del', 21, 'cd' ) }e`
			) }f`;
			expect( normalizeHTML( one ) ).toBe( normalizeHTML( two ) );
		} );

		it( 'keeps markers of different kinds and only puts them in order', () => {
			// A merge can put a deletion outside the addition it sits in.
			const merged = `a${ mark( 'del', 3, mark( 'add', 1, 'bc' ) ) }d`;
			expect( normalizeHTML( merged ) ).toBe(
				`a${ mark( 'add', 1, mark( 'del', 3, 'bc' ) ) }d`
			);
		} );

		it( 'returns the record itself when there is nothing to fix', () => {
			const record = create( {
				html: `a${ mark( 'add', 1, mark( 'del', 3, 'bc' ) ) }d`,
			} );
			expect( normalizeSuggestionMarkers( record ) ).toBe( record );
		} );

		it( 'is idempotent, so a corrective write never triggers another', () => {
			const merged = `a${ mark(
				'add',
				15,
				`bc${ mark( 'add', 12, 'de' ) }f`
			) }g`;
			const once = normalizeHTML( merged );
			expect( normalizeHTML( once ) ).toBe( once );
		} );
	} );

	describe( 'guardMarkerIntegrity', () => {
		const pending =
			( ...ids: string[] ) =>
			( id: string ) =>
				ids.includes( id );

		it( 'restores a pending marker whose id a merge replaced', () => {
			const prev = create( { html: `a${ mark( 'del', 5, 'bc' ) }d` } );
			const next = create( { html: `a${ mark( 'del', 9, 'bc' ) }d` } );
			const guarded = guardMarkerIntegrity( prev, next, {
				isPending: pending( '5', '9' ),
			} );
			expect( guarded ).not.toBe( next );
			const value = new RichTextData( guarded as any );
			expect( findSuggestionText( value, 5 ) ).toBe( 'bc' );
			expect( findSuggestionText( value, 9 ) ).toBe( '' );
		} );

		it( 'lets a resolved marker’s characters go to the newer one', () => {
			const prev = create( { html: `a${ mark( 'del', 5, 'bc' ) }d` } );
			const next = create( { html: `a${ mark( 'del', 9, 'bc' ) }d` } );
			expect(
				guardMarkerIntegrity( prev, next, {
					isPending: pending( '9' ),
				} )
			).toBe( next );
		} );

		it( 'maps characters across an edit elsewhere in the value', () => {
			const prev = create( { html: `a${ mark( 'del', 5, 'bc' ) }d` } );
			const next = create( {
				html: `XYa${ mark( 'del', 9, 'bc' ) }d`,
			} );
			const value = new RichTextData(
				guardMarkerIntegrity( prev, next, {
					isPending: pending( '5', '9' ),
				} ) as any
			);
			expect( findSuggestionText( value, 5 ) ).toBe( 'bc' );
		} );

		it( 'leaves a marker that was simply removed alone', () => {
			const prev = create( { html: `a${ mark( 'del', 5, 'bc' ) }d` } );
			const next = create( { html: 'abcd' } );
			expect(
				guardMarkerIntegrity( prev, next, {
					isPending: pending( '5' ),
				} )
			).toBe( next );
		} );

		it( 'also orders same-kind overlap in the merged value', () => {
			const prev = create( { html: 'abcdefg' } );
			const next = create( {
				html: `a${ mark( 'add', 15, `bc${ mark( 'add', 12, 'de' ) }f` ) }g`,
			} );
			const value = new RichTextData(
				guardMarkerIntegrity( prev, next, {
					isPending: pending( '12', '15' ),
				} ) as any
			);
			expect( findSuggestionText( value, 12 ) ).toBe( 'de' );
			expect( findSuggestionText( value, 15 ) ).toBe( 'bcdef' );
		} );

		it( 'restores a swapped id in a stack, keeping the other marker', () => {
			const prev = create( {
				html: `a${ mark( 'del', 5, mark( 'del', 6, 'bc' ) ) }d`,
			} );
			const next = create( {
				html: `a${ mark( 'del', 5, mark( 'del', 9, 'bc' ) ) }d`,
			} );
			const value = new RichTextData(
				guardMarkerIntegrity( prev, next, {
					isPending: pending( '5', '6' ),
				} ) as any
			);
			expect( findSuggestionText( value, 6 ) ).toBe( 'bc' );
			expect( findSuggestionText( value, 5 ) ).toBe( 'bc' );
			expect( findSuggestionText( value, 9 ) ).toBe( '' );
		} );
	} );

	describe( 'guardSyncedValue', () => {
		const pending = () => true;
		const htmlOf = ( record: any ) =>
			new RichTextData( record ).toHTMLString();

		it( 'leaves a local edit to a canonical value alone', () => {
			const before = create( { html: `a${ mark( 'del', 5, 'bc' ) }d` } );
			const value = create( { html: `a${ mark( 'del', 5, 'bc' ) }dX` } );
			expect(
				guardSyncedValue( before, value, { isPending: pending } )
			).toBeNull();
		} );

		it( 'drops a marker whose id a merge garbled', () => {
			const before = create( { html: `a${ mark( 'del', 20, 'b' ) }cd` } );
			const value = create( {
				html: `a${ mark( 'del', 20, 'b' ) }<mark data-suggestion-id="2x0" data-suggestion-type="del" data-author="2" class="wp-suggestion-del">c</mark>d`,
			} );
			const guarded = guardSyncedValue( before, value, {
				isPending: pending,
			} );
			expect( htmlOf( guarded ) ).toBe(
				`a${ mark( 'del', 20, 'b' ) }cd`
			);
		} );

		it( 'drops a new marker whose note is not a suggestion on this post', () => {
			const before = create( { html: 'abcd' } );
			const value = create( {
				html: `a${ mark( 'del', 201, 'bc' ) }${ mark( 'del', 7, 'd' ) }`,
			} );
			const guarded = guardSyncedValue( before, value, {
				isPending: pending,
				isForeign: ( id ) => id === '201',
			} );
			expect( htmlOf( guarded ) ).toBe( `abc${ mark( 'del', 7, 'd' ) }` );
		} );

		it( 'does not look up ids the slot already had', () => {
			const before = create( {
				html: `a${ mark( 'del', 201, 'bc' ) }d`,
			} );
			const value = create( {
				html: `a${ mark( 'del', 201, 'bc' ) }dX`,
			} );
			const asked: string[] = [];
			expect(
				guardSyncedValue( before, value, {
					isPending: pending,
					isForeign: ( id ) => asked.push( id ) > 0,
				} )
			).toBeNull();
			expect( asked ).toEqual( [] );
		} );

		it( 'drops the empty marker a concurrent decision leaves', () => {
			// One peer accepted a deletion while another marked the same
			// words: the words went, the other marker's tags stayed.
			const value = create( {
				html: `a${ mark( 'del', 9, '' ) }d`,
			} );
			expect( value.text ).toHaveLength( 3 );
			const guarded: any = guardSyncedValue( undefined, value, {
				isPending: pending,
			} );
			expect( guarded.text ).toBe( 'ad' );
			expect( htmlOf( guarded ) ).toBe( 'ad' );
		} );

		describe( 'with peers', () => {
			// User 3 nested deletion 21 in user 2's deletion 20; the merge
			// put 21 outside.
			const merged = () =>
				create( {
					html: `a${ mark(
						'del',
						21,
						mark( 'del', 20, 'bc', 2 ),
						3
					) }d`,
				} );

			it( 'lets only the author of the newest marker move markup', () => {
				const value = merged();
				const corrections = [ '1', '2', '3' ].map( ( userId ) =>
					guardSyncedValue( undefined, value, {
						isPending: pending,
						userId,
					} )
				);
				expect( corrections.map( Boolean ) ).toEqual( [
					false,
					false,
					true,
				] );
				expect( htmlOf( corrections[ 2 ] ) ).toBe(
					`a${ mark( 'del', 20, mark( 'del', 21, 'bc', 3 ), 2 ) }d`
				);
			} );

			it( 'lets every peer write a correction that only deletes markup', () => {
				const value = create( {
					html: `a${ mark( 'del', 9, '', 4 ) }d`,
				} );
				const corrections = [ '1', '2' ].map( ( userId ) =>
					guardSyncedValue( undefined, value, {
						isPending: pending,
						userId,
					} )
				);
				expect( corrections.every( Boolean ) ).toBe( true );
			} );
		} );
	} );

	describe( 'isCanonicalSuggestionStack', () => {
		it( 'flags one marker written as two elements where it could be one', () => {
			const split = create( {
				html: `a${ mark( 'del', 5, 'b' ) }${ mark( 'del', 5, 'c' ) }d`,
			} );
			expect( isCanonicalSuggestionStack( split.formats ) ).toBe( false );
		} );

		it( 'accepts a marker another marker fragments', () => {
			const fragmented = create( {
				html: `a${ mark( 'del', 5, mark( 'del', 7, 'b' ) ) }${ mark(
					'del',
					7,
					'c'
				) }d`,
			} );
			expect( isCanonicalSuggestionStack( fragmented.formats ) ).toBe(
				true
			);
		} );
	} );
} );
