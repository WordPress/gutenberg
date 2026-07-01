/**
 * WordPress dependencies
 */
import {
	RichTextData,
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	analyzeFormatEdit,
	planFormatMarkers,
	applyFormatPlan,
} from '../reconcile-format';
import {
	registerSuggestionFormat,
	findSuggestionRange,
	SUGGESTION_FORMAT_NAME,
} from '../format';

const getFormatType = ( name ) => select( richTextStore ).getFormatType( name );

const rtd = ( html ) => RichTextData.fromHTMLString( html );

beforeAll( () => {
	if ( ! getFormatType( SUGGESTION_FORMAT_NAME ) ) {
		registerSuggestionFormat();
	}
	if ( ! getFormatType( 'test/bold' ) ) {
		registerFormatType( 'test/bold', {
			title: 'Bold',
			tagName: 'strong',
			className: null,
			edit: () => null,
		} );
	}
	if ( ! getFormatType( 'test/link' ) ) {
		registerFormatType( 'test/link', {
			title: 'Link',
			tagName: 'a',
			className: null,
			attributes: { href: 'href' },
			edit: () => null,
		} );
	}
} );

afterAll( () => {
	[ 'test/bold', 'test/link', SUGGESTION_FORMAT_NAME ].forEach( ( name ) => {
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
			'Hello <mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="del">world</mark>'
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

	it( 'returns kind "none" when the change overlaps an existing marker', () => {
		// The run already carries a suggestion marker; do not nest.
		const prev = rtd(
			'Hello <mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="add">world</mark>'
		);
		const next = rtd(
			'Hello <mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="add"><strong>world</strong></mark>'
		);
		expect( planFormatMarkers( prev, next ) ).toEqual( { kind: 'none' } );
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
