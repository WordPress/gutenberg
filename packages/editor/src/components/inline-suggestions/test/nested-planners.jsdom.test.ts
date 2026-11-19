/**
 * The edit and format planners on text that carries another author's
 * marker: nested and spanning suggestions they now plan, and the overlaps
 * they still refuse, with the marker that blocks them.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	RichTextData,
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import {
	registerSuggestionFormat,
	unregisterSuggestionFormats,
	findSuggestionText,
	suggestionKindOf,
} from '../format';
import { applyEditPlan, planEditMarkers } from '../reconcile-edit';
import { applyFormatPlan, planFormatMarkers } from '../reconcile-format';

const BOLD = 'test/planners-bold';
const ME = 1;

const mark = (
	kind: 'add' | 'del' | 'format',
	id: number,
	inner: string,
	author = 2
) =>
	`<mark data-suggestion-id="${ id }" data-suggestion-type="${ kind }" data-author="${ author }" class="wp-suggestion-${ kind }">${ inner }</mark>`;

const rtd = ( html: string ) => RichTextData.fromHTMLString( html );

// "ab" + another author's addition "CDEF" (offsets 2-6) + "gh".
const withAddition = () => rtd( `ab${ mark( 'add', 7, 'CDEF' ) }gh` );

const kindsAt = ( value: RichTextData, index: number ) =>
	( ( value.formats as any[] )[ index ] ?? [] ).map(
		( f: any ) => suggestionKindOf( f ) ?? f.type
	);

describe( 'planners over nested suggestions', () => {
	beforeAll( () => {
		registerSuggestionFormat();
		if (
			! ( select( richTextStore as any ) as any ).getFormatType( BOLD )
		) {
			registerFormatType( BOLD, {
				title: 'Bold',
				tagName: 'strong',
				className: null,
				edit: () => null,
			} as any );
		}
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
		unregisterFormatType( BOLD );
	} );

	describe( 'planEditMarkers', () => {
		it( 'plans a nested deletion inside another author’s addition', () => {
			const prev = withAddition();
			const next = rtd( `ab${ mark( 'add', 7, 'CF' ) }gh` );
			const plan = planEditMarkers( prev, next, { authorId: ME } );
			expect( plan.actions ).toEqual( [
				{ type: 'wrap-del', start: 3, end: 5, newNote: true },
			] );
			const marked = applyEditPlan( prev, plan.actions, {
				authorId: ME,
				ids: [ 9 ],
			} );
			expect( findSuggestionText( marked, 7 ) ).toBe( 'CDEF' );
			expect( findSuggestionText( marked, 9 ) ).toBe( 'DE' );
			expect( kindsAt( marked, 3 ) ).toEqual( [ 'add', 'del' ] );
		} );

		it( 'plans one deletion spanning plain text and another author’s addition', () => {
			const prev = withAddition();
			const next = rtd( `a${ mark( 'add', 7, 'EF' ) }gh` );
			const plan = planEditMarkers( prev, next, { authorId: ME } );
			expect( plan.actions ).toEqual( [
				{ type: 'wrap-del', start: 1, end: 4, newNote: true },
			] );
		} );

		it( 'refuses a deletion over another author’s deletion, naming it', () => {
			const prev = rtd( `ab${ mark( 'del', 7, 'CDEF' ) }gh` );
			const next = rtd( `ab${ mark( 'del', 7, 'CF' ) }gh` );
			const plan = planEditMarkers( prev, next, { authorId: ME } );
			expect( plan.actions ).toEqual( [] );
			expect( plan.refusal ).toEqual( {
				reason: 'del-over-del',
				blocking: { id: '7', kind: 'del', authorId: '2' },
			} );
		} );

		it( 'refuses typing inside another author’s addition', () => {
			const prev = withAddition();
			const next = rtd( `ab${ mark( 'add', 7, 'CDxEF' ) }gh` );
			const plan = planEditMarkers( prev, next, { authorId: ME } );
			expect( plan.actions ).toEqual( [] );
			expect( plan.refusal?.reason ).toBe( 'add-in-add' );
		} );

		it( 'refuses typing inside another author’s deletion', () => {
			const prev = rtd( `ab${ mark( 'del', 7, 'CDEF' ) }gh` );
			const next = rtd( `ab${ mark( 'del', 7, 'CDxEF' ) }gh` );
			expect(
				planEditMarkers( prev, next, { authorId: ME } ).refusal?.reason
			).toBe( 'insert-in-del' );
		} );

		it( 'adds next to, not into, another author’s formatting change', () => {
			const prev = rtd(
				`ab${ mark( 'format', 7, '<strong>CDEF</strong>' ) }gh`
			);
			const next = rtd(
				`ab${ mark( 'format', 7, '<strong>CDxEF</strong>' ) }gh`
			);
			const plan = planEditMarkers( prev, next, { authorId: ME } );
			expect( plan.actions ).toMatchObject( [
				{ type: 'insert-add', at: 4, text: 'x', newNote: true },
			] );
			const marked = applyEditPlan( prev, plan.actions, {
				authorId: ME,
				ids: [ 9 ],
			} );
			// The typed character is this author's addition only; it does
			// not join the other author's formatting change.
			expect( kindsAt( marked, 4 ) ).not.toContain( 'format' );
			expect( kindsAt( marked, 4 )[ 0 ] ).toBe( 'add' );
			expect( findSuggestionText( marked, 7 ) ).toBe( 'CDEF' );
		} );
	} );

	describe( 'planFormatMarkers', () => {
		it( 'plans a nested formatting change inside another author’s addition', () => {
			const prev = withAddition();
			const next = rtd(
				`ab${ mark( 'add', 7, 'C<strong>DE</strong>F' ) }gh`
			);
			const plan = planFormatMarkers( prev, next, { authorId: ME } );
			expect( plan ).toMatchObject( {
				kind: 'format',
				range: { start: 3, end: 5 },
				// The original is the proposed text's own formatting, with no
				// marker in it.
				beforeHTML: 'DE',
				afterHTML: '<strong>DE</strong>',
			} );
			const marked = applyFormatPlan( next, plan, {
				id: 9,
				authorId: ME,
			} );
			expect( kindsAt( marked, 3 ) ).toEqual( [ 'add', 'format', BOLD ] );
			expect( findSuggestionText( marked, 7 ) ).toBe( 'CDEF' );
		} );

		it( 'refuses a formatting change across another author’s addition’s edge', () => {
			const prev = withAddition();
			const next = rtd(
				`a<strong>b</strong>${ mark(
					'add',
					7,
					'<strong>C</strong>DEF'
				) }gh`
			);
			const plan = planFormatMarkers( prev, next, { authorId: ME } );
			expect( plan ).toEqual( {
				kind: 'refuse',
				reason: 'format-straddles-add',
				blocking: { id: '7', kind: 'add', authorId: '2' },
			} );
		} );

		it( 'refuses a formatting change over another author’s formatting change', () => {
			const prev = rtd(
				`ab${ mark( 'format', 7, '<strong>CDEF</strong>' ) }gh`
			);
			const next = rtd(
				`ab${ mark(
					'format',
					7,
					'<strong>C</strong>DE<strong>F</strong>'
				) }gh`
			);
			expect(
				planFormatMarkers( prev, next, { authorId: ME } )
			).toMatchObject( { kind: 'refuse', reason: 'format-on-format' } );
		} );

		it( 'plans a formatting change over another author’s deletion', () => {
			const prev = rtd( `ab${ mark( 'del', 7, 'CDEF' ) }gh` );
			const next = rtd(
				`ab${ mark( 'del', 7, 'C<strong>DE</strong>F' ) }gh`
			);
			const plan = planFormatMarkers( prev, next, { authorId: ME } );
			expect( plan ).toMatchObject( {
				kind: 'format',
				beforeHTML: 'DE',
			} );
			const marked = applyFormatPlan( next, plan, {
				id: 9,
				authorId: ME,
			} );
			// Format outside del, the canonical order.
			expect( kindsAt( marked, 3 ) ).toEqual( [ 'format', 'del', BOLD ] );
			expect( findSuggestionText( marked, 7 ) ).toBe( 'CDEF' );
		} );
	} );
} );
