import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	RichTextData,
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import {
	analyzeFormatEdit,
	planFormatMarkers,
	applyFormatPlan,
} from '../reconcile-format';
import {
	registerSuggestionFormat,
	findSuggestionRange,
	unregisterSuggestionFormats,
} from '../format';

const getFormatType = ( name: string ) =>
	( select( richTextStore as any ) as any ).getFormatType( name );

const rtd = ( html: string ) => RichTextData.fromHTMLString( html );

// A pending `format` marker authored by user 7, wrapping the given inner HTML.
const formatMark = ( id: number | string, inner: string ) =>
	`<mark class="wp-suggestion-format" data-suggestion-id="${ id }" data-suggestion-type="format" data-author="7">${ inner }</mark>`;

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
	if ( ! getFormatType( 'test/link' ) ) {
		registerFormatType( 'test/link', {
			title: 'Link',
			tagName: 'a',
			className: null,
			attributes: { href: 'href' },
			edit: () => null,
		} as any );
	}
} );

afterAll( () => {
	unregisterSuggestionFormats();
	[ 'test/bold', 'test/link' ].forEach( ( name ) => {
		if ( getFormatType( name ) ) {
			unregisterFormatType( name );
		}
	} );
} );

describe( 'analyzeFormatEdit', () => {
	it( 'returns null when nothing changed', () => {
		expect(
			analyzeFormatEdit( rtd( 'Hello world' ), rtd( 'Hello world' ) )
		).toBeNull();
	} );

	it( 'returns null when the text itself changed (that is a text edit)', () => {
		expect(
			analyzeFormatEdit( rtd( 'Hello world' ), rtd( 'Hello there' ) )
		).toBeNull();
	} );

	it( 'returns null for non-rich values', () => {
		expect( analyzeFormatEdit( null, undefined ) ).toBeNull();
		expect( analyzeFormatEdit( 42, {} ) ).toBeNull();
	} );

	it( 'detects a run that gained a format (bold applied to "world")', () => {
		// "Hello " is 6 chars; "world" spans [6, 11).
		expect(
			analyzeFormatEdit(
				rtd( 'Hello world' ),
				rtd( 'Hello <strong>world</strong>' )
			)
		).toEqual( { start: 6, end: 11 } );
	} );

	it( 'detects a run that lost a format (bold removed)', () => {
		expect(
			analyzeFormatEdit(
				rtd( 'Hello <strong>world</strong>' ),
				rtd( 'Hello world' )
			)
		).toEqual( { start: 6, end: 11 } );
	} );

	it( 'detects a link applied over a run', () => {
		expect(
			analyzeFormatEdit(
				rtd( 'see docs' ),
				rtd( 'see <a href="https://w.org">docs</a>' )
			)
		).toEqual( { start: 4, end: 8 } );
	} );

	it( 'detects a changed format attribute (href edited) on the same run', () => {
		expect(
			analyzeFormatEdit(
				rtd( 'see <a href="https://a.test">docs</a>' ),
				rtd( 'see <a href="https://b.test">docs</a>' )
			)
		).toEqual( { start: 4, end: 8 } );
	} );

	it( 'ignores the suggestion marker itself (no false positive)', () => {
		const marked = rtd(
			'Hello <mark class="wp-suggestion-del" data-suggestion-id="1" data-suggestion-type="del">world</mark>'
		);
		expect( analyzeFormatEdit( marked, marked ) ).toBeNull();
	} );
} );

describe( 'planFormatMarkers', () => {
	it( 'plans a format change as kind "format" with the range and before/after HTML', () => {
		const plan = planFormatMarkers(
			rtd( 'Hello world' ),
			rtd( 'Hello <strong>world</strong>' )
		);
		expect( plan.kind ).toBe( 'format' );
		expect( plan.range ).toEqual( { start: 6, end: 11 } );
		// The original run (for reject) is plain; the proposed run is bold.
		expect( plan.beforeHTML ).toBe( 'world' );
		expect( plan.afterHTML ).toBe( '<strong>world</strong>' );
	} );

	it( 'returns kind "none" when there is no format change', () => {
		expect(
			planFormatMarkers( rtd( 'Hello world' ), rtd( 'Hello world' ) )
		).toEqual( { kind: 'none' } );
	} );

	it( 'declines a change inside the author own pending addition', () => {
		// An unauthored marker and an unknown editor count as the same
		// author: their own addition is not a run to suggest formatting on.
		const prev = rtd(
			'Hello <mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">world</mark>'
		);
		const next = rtd(
			'Hello <mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add"><strong>world</strong></mark>'
		);
		expect( planFormatMarkers( prev, next ) ).toMatchObject( {
			kind: 'refuse',
			reason: 'own-marker',
		} );
	} );

	it( "extends the suggester's own format marker on a second toggle", () => {
		const prev = rtd(
			`Hello ${ formatMark( 1, '<strong>world</strong>' ) }`
		);
		const next = rtd(
			`Hello ${ formatMark( 1, '<strong><em>world</em></strong>' ) }`
		);
		const plan = planFormatMarkers( prev, next, { authorId: 7 } );
		expect( plan.kind ).toBe( 'format' );
		expect( plan.extendsId ).toBe( '1' );
		expect( plan.range ).toEqual( { start: 6, end: 11 } );
		// The proposed run is captured without the marker wrapper, and the
		// original stays on the existing note rather than being recaptured
		// from the already-suggested run.
		expect( plan.afterHTML ).toBe( '<strong><em>world</em></strong>' );
		expect( plan.beforeHTML ).toBeUndefined();
	} );

	it( "declines to extend another author's marker", () => {
		const prev = rtd(
			`Hello ${ formatMark( 1, '<strong>world</strong>' ) }`
		);
		const next = rtd(
			`Hello ${ formatMark( 1, '<strong><em>world</em></strong>' ) }`
		);
		const refusal = {
			kind: 'refuse',
			reason: 'format-on-format',
			blocking: { id: '1', kind: 'format', authorId: '7' },
		};
		expect( planFormatMarkers( prev, next, { authorId: 9 } ) ).toEqual(
			refusal
		);
		// And with no author at all (anonymous edit) it stays conservative.
		expect( planFormatMarkers( prev, next ) ).toEqual( refusal );
	} );

	it( 'declines to extend when the toggle spills past the marker', () => {
		const prev = rtd( `Hello ${ formatMark( 1, 'world' ) }` );
		const next = rtd(
			`<strong>Hello ${ formatMark( 1, 'world' ) }</strong>`
		);
		expect(
			planFormatMarkers( prev, next, { authorId: 7 } )
		).toMatchObject( { kind: 'refuse', reason: 'own-marker' } );
	} );

	it( 'declines to extend over a marker nested inside the run', () => {
		/*
		 * An `add` marker inside the run (merged or older markup) is not
		 * part of this suggestion: extending only revises a run that holds no
		 * other marker, so the toggle is declined.
		 */
		const nested =
			'<mark class="wp-suggestion-add" data-suggestion-id="2" data-suggestion-type="add" data-author="7">XX</mark>';
		const prev = rtd(
			`Hello ${ formatMark( 1, `<strong>wor${ nested }ld</strong>` ) }`
		);
		const next = rtd(
			`Hello ${ formatMark(
				1,
				`<strong><em>wor${ nested }ld</em></strong>`
			) }`
		);
		expect(
			planFormatMarkers( prev, next, { authorId: 7 } )
		).toMatchObject( { kind: 'refuse', reason: 'own-marker' } );
	} );

	it( 'reports the run text so the caller can check it against the note', () => {
		// A reject restores the note's recorded original over the marker's whole
		// span, so the caller has to be able to tell the two still cover the
		// same characters.
		const prev = rtd(
			`Hello ${ formatMark( 1, '<strong>world</strong>' ) }`
		);
		const next = rtd(
			`Hello ${ formatMark( 1, '<strong><em>world</em></strong>' ) }`
		);
		const plan = planFormatMarkers( prev, next, { authorId: 7 } );
		expect( plan.runText ).toBe( 'world' );
	} );

	it( 'declines to extend a marker that is not a format suggestion', () => {
		const prev = rtd(
			'Hello <mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add" data-author="7">world</mark>'
		);
		const next = rtd(
			'Hello <mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add" data-author="7"><strong>world</strong></mark>'
		);
		expect(
			planFormatMarkers( prev, next, { authorId: 7 } )
		).toMatchObject( { kind: 'refuse', reason: 'own-marker' } );
	} );
} );

describe( 'applyFormatPlan', () => {
	it( 'returns the value unchanged for a non-format plan or missing id', () => {
		const next = rtd( 'Hello <strong>world</strong>' );
		expect( applyFormatPlan( next, { kind: 'none' } ) ).toBe( next );
		expect(
			applyFormatPlan( next, {
				kind: 'format',
				range: { start: 6, end: 11 },
			} )
		).toBe( next );
	} );

	it( 'wraps the reformatted run in a single format marker (no duplication)', () => {
		const prev = rtd( 'Hello world' );
		const next = rtd( 'Hello <strong>world</strong>' );
		const plan = planFormatMarkers( prev, next );
		const result = applyFormatPlan( next, plan, { id: 10, authorId: 7 } );

		// One marker, resolving to the reformatted run.
		expect( findSuggestionRange( result, 10 ) ).toEqual( {
			start: 6,
			end: 11,
		} );

		const html = result.toHTMLString();
		expect( html ).toContain( 'data-suggestion-type="format"' );
		expect( html ).toContain( 'data-suggestion-id="10"' );
		expect( html ).toContain( 'data-author="7"' );
		// The proposed formatting is carried in place; the text appears once.
		expect( html ).toContain( '<strong>' );
		expect( html.match( /world/g ) ).toHaveLength( 1 );
	} );

	it( 'keeps the extended marker whole, with its original id and author', () => {
		const prev = rtd(
			`Hello ${ formatMark( 1, '<strong>world</strong>' ) }`
		);
		const next = rtd(
			`Hello ${ formatMark( 1, '<strong><em>world</em></strong>' ) }`
		);
		const plan = planFormatMarkers( prev, next, { authorId: 7 } );
		const result = applyFormatPlan( next, plan );

		expect( findSuggestionRange( result, 1 ) ).toEqual( {
			start: 6,
			end: 11,
		} );
		const html = result.toHTMLString();
		expect( html.match( /<mark/g ) ).toHaveLength( 1 );
		expect( html ).toContain( 'data-suggestion-id="1"' );
		expect( html ).toContain( 'data-author="7"' );
		expect( html ).toContain( '<strong>' );
		expect( html ).toContain( '<em>' );
		expect( html.match( /world/g ) ).toHaveLength( 1 );
	} );

	it( 'wraps the marker around the run’s own formatting', () => {
		const prev = rtd( 'Hello world' );
		const next = rtd( 'Hello <strong>world</strong>' );
		const plan = planFormatMarkers( prev, next );
		const result = applyFormatPlan( next, plan, { id: 10, authorId: 7 } );

		// The front end replaces the marker's whole span with the original
		// run, so the proposed formatting has to sit inside it.
		expect( result.toHTMLString() ).toBe(
			rtd(
				`Hello ${ formatMark( 10, '<strong>world</strong>' ) }`
			).toHTMLString()
		);
	} );

	it( 'keeps one marker over a run with mixed formatting', () => {
		const prev = rtd( 'Hello <em>wor</em>ld' );
		const next = rtd( 'Hello <strong><em>wor</em>ld</strong>' );
		const plan = planFormatMarkers( prev, next );
		const result = applyFormatPlan( next, plan, { id: 11, authorId: 7 } );

		const html = result.toHTMLString();
		expect( html.match( /<mark/g ) ).toHaveLength( 1 );
		expect( findSuggestionRange( result, 11 ) ).toEqual( {
			start: 6,
			end: 11,
		} );
	} );

	it( 'preserves a link (format attributes) in the marked run', () => {
		const prev = rtd( 'see docs' );
		const next = rtd( 'see <a href="https://w.org">docs</a>' );
		const plan = planFormatMarkers( prev, next );
		const result = applyFormatPlan( next, plan, { id: 4 } );
		const html = result.toHTMLString();
		expect( html ).toContain( 'href="https://w.org"' );
		expect( html ).toContain( 'data-suggestion-type="format"' );
		expect( html.match( /docs/g ) ).toHaveLength( 1 );
	} );
} );
