/**
 * The RTC guard: content merged from a peer can carry two markers of one kind
 * over the same characters, or a marker whose id changed under a
 * last-writer-wins attribute merge. The guard resolves both the same way on
 * every peer, so they converge.
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
		it( 'gives overlapping same-kind characters to the older (lower) id', () => {
			const merged = `a${ mark(
				'add',
				15,
				`bc${ mark( 'add', 12, 'de' ) }f`
			) }g`;
			const value = RichTextData.fromHTMLString(
				normalizeHTML( merged )
			);
			expect( findSuggestionText( value, 12 ) ).toBe( 'de' );
			expect( findSuggestionText( value, 15 ) ).toBe( 'bcf' );
		} );

		it( 'resolves crossing deletions by two authors the same way', () => {
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
			expect( findSuggestionText( value, 21 ) ).toBe( 'b' );
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

		it( 'also resolves same-kind overlap in the merged value', () => {
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
			expect( findSuggestionText( value, 15 ) ).toBe( 'bcf' );
		} );
	} );
} );
