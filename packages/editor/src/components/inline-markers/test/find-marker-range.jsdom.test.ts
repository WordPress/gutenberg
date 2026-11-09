import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	RichTextData,
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import { findMarkerRange, findMarkerText } from '../find-marker-range';

const FORMAT_NAME = 'test/marker';

const isRegistered = () =>
	!! ( select( richTextStore as any ) as any ).getFormatType( FORMAT_NAME );

const options = {
	formatType: FORMAT_NAME,
	idAttribute: 'data-id',
	quickReject: 'wp-marker',
};

describe( 'findMarkerRange', () => {
	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( FORMAT_NAME, {
				title: 'Marker',
				tagName: 'mark',
				className: 'wp-marker',
				attributes: {
					'data-id': 'data-id',
					'data-suggestion-id': 'data-suggestion-id',
				},
				edit: () => null,
			} as any );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( FORMAT_NAME );
		}
	} );

	it( 'returns null for null/undefined input', () => {
		expect( findMarkerRange( null, { ...options, id: 7 } ) ).toBeNull();
		expect(
			findMarkerRange( undefined, { ...options, id: 7 } )
		).toBeNull();
	} );

	it( 'returns null when no marker is present', () => {
		const value = RichTextData.fromHTMLString( 'hello world' );
		expect( findMarkerRange( value, { ...options, id: 7 } ) ).toBeNull();
	} );

	it( 'returns range for a marker matching the id (RichTextData)', () => {
		const value = RichTextData.fromHTMLString(
			'hello <mark class="wp-marker" data-id="7">marked</mark> world'
		);
		expect( findMarkerRange( value, { ...options, id: 7 } ) ).toEqual( {
			start: 6,
			end: 12,
		} );
	} );

	it( 'returns range for a marker matching the id (string)', () => {
		const html =
			'hello <mark class="wp-marker" data-id="7">marked</mark> world';
		expect( findMarkerRange( html, { ...options, id: 7 } ) ).toEqual( {
			start: 6,
			end: 12,
		} );
	} );

	it( 'returns null when the marker id does not match', () => {
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-marker" data-id="3">x</mark>'
		);
		expect( findMarkerRange( value, { ...options, id: 7 } ) ).toBeNull();
	} );

	it( 'coerces ids to strings so numeric vs string ids match', () => {
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-marker" data-id="7">x</mark>'
		);
		expect( findMarkerRange( value, { ...options, id: '7' } ) ).toEqual( {
			start: 0,
			end: 1,
		} );
	} );

	it( 'returns null when the id itself is null/undefined', () => {
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-marker" data-id="7">x</mark>'
		);
		expect( findMarkerRange( value, { ...options, id: null } ) ).toBeNull();
		expect(
			findMarkerRange( value, { ...options, id: undefined } )
		).toBeNull();
	} );

	it( 'rejects via quickReject without parsing when the token is absent', () => {
		// The marker is present but the quickReject token is not, so the
		// cheap substring check short-circuits before any rich-text parse.
		const html = '<mark class="other" data-id="7">x</mark>';
		expect(
			findMarkerRange( html, {
				formatType: FORMAT_NAME,
				idAttribute: 'data-id',
				id: 7,
				quickReject: 'wp-marker',
			} )
		).toBeNull();
	} );

	it( 'matches a custom id attribute', () => {
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-marker" data-suggestion-id="9">x</mark>'
		);
		expect(
			findMarkerRange( value, {
				formatType: FORMAT_NAME,
				idAttribute: 'data-suggestion-id',
				id: 9,
				quickReject: 'wp-marker',
			} )
		).toEqual( { start: 0, end: 1 } );
	} );

	it( 'resolves the range after an unrelated edit shifts the marker', () => {
		// Anchoring contract: a marker survives edits elsewhere in the value
		// and resolves to its current (shifted) offset, never a stored one.
		const value = RichTextData.fromHTMLString(
			'prefix <mark class="wp-marker" data-id="7">marked</mark>'
		);
		expect( findMarkerRange( value, { ...options, id: 7 } ) ).toEqual( {
			start: 7,
			end: 13,
		} );
	} );

	it( 'spans a split (non-contiguous) run of the same id', () => {
		// An edit inside the run can leave the same id in two separate marks.
		// The range must span first -> last hit, not stop at the first gap,
		// or accept/reject would only resolve the first fragment.
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-marker" data-id="7">AB</mark>XY' +
				'<mark class="wp-marker" data-id="7">CD</mark>'
		);
		expect( findMarkerRange( value, { ...options, id: 7 } ) ).toEqual( {
			start: 0,
			end: 6,
		} );
	} );

	it( 'does not merge distinct marker ids that share the value', () => {
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-marker" data-id="7">AB</mark>XY' +
				'<mark class="wp-marker" data-id="8">CD</mark>'
		);
		expect( findMarkerRange( value, { ...options, id: 7 } ) ).toEqual( {
			start: 0,
			end: 2,
		} );
		expect( findMarkerRange( value, { ...options, id: 8 } ) ).toEqual( {
			start: 4,
			end: 6,
		} );
	} );

	it( 'spans across ANOTHER marker interleaved inside a fragmented run', () => {
		/*
		 * A fragmented marker (same id split in two) with a DIFFERENT
		 * suggestion's marker sitting in the gap: the outer id's range still
		 * spans first -> last hit, which includes the inner marker's text.
		 * Pinned here because span-consumers must not treat the whole range
		 * as belonging to the outer id — see `removeMarkedRange`
		 * (inline-suggestions/operations.js), which removes only the
		 * characters carrying the outer id so accept/reject of the outer
		 * marker can't delete the inner marker's text.
		 */
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-marker" data-id="7">AB</mark>' +
				'<mark class="wp-marker" data-id="8">IN</mark>' +
				'<mark class="wp-marker" data-id="7">CD</mark>'
		);
		expect( findMarkerRange( value, { ...options, id: 7 } ) ).toEqual( {
			start: 0,
			end: 6,
		} );
		// The inner marker still resolves independently.
		expect( findMarkerRange( value, { ...options, id: 8 } ) ).toEqual( {
			start: 2,
			end: 4,
		} );
	} );
} );

describe( 'findMarkerText', () => {
	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( FORMAT_NAME, {
				title: 'Marker',
				tagName: 'mark',
				className: 'wp-marker',
				attributes: {
					'data-id': 'data-id',
					'data-suggestion-id': 'data-suggestion-id',
				},
				edit: () => null,
			} as any );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( FORMAT_NAME );
		}
	} );

	it( 'returns the marked text for a matching id', () => {
		const value = RichTextData.fromHTMLString(
			'hello <mark class="wp-marker" data-id="7">new text</mark> world'
		);
		expect( findMarkerText( value, { ...options, id: 7 } ) ).toBe(
			'new text'
		);
	} );

	it( 'returns the marked text from a plain HTML string', () => {
		const html = 'a <mark class="wp-marker" data-id="7">marked</mark> b';
		expect( findMarkerText( html, { ...options, id: 7 } ) ).toBe(
			'marked'
		);
	} );

	it( 'quotes only the characters carrying the id in a fragmented marker', () => {
		// The span of a fragmented marker can hold unmarked text (a gap)...
		const gap = RichTextData.fromHTMLString(
			'<mark class="wp-marker" data-id="7">AB</mark>XY' +
				'<mark class="wp-marker" data-id="7">CD</mark>'
		);
		expect( findMarkerText( gap, { ...options, id: 7 } ) ).toBe( 'ABCD' );

		// ...or another marker. Neither belongs to the suggestion the summary
		// describes; accept and reject act on the owned characters only.
		const interleaved = RichTextData.fromHTMLString(
			'<mark class="wp-marker" data-id="7">AB</mark>' +
				'<mark class="wp-marker" data-id="8">IN</mark>' +
				'<mark class="wp-marker" data-id="7">CD</mark>'
		);
		expect( findMarkerText( interleaved, { ...options, id: 7 } ) ).toBe(
			'ABCD'
		);
		expect( findMarkerText( interleaved, { ...options, id: 8 } ) ).toBe(
			'IN'
		);
	} );

	it( 'returns an empty string when no marker matches', () => {
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-marker" data-id="3">x</mark>'
		);
		expect( findMarkerText( value, { ...options, id: 7 } ) ).toBe( '' );
	} );

	it( 'returns an empty string for null input or a missing id', () => {
		expect( findMarkerText( null, { ...options, id: 7 } ) ).toBe( '' );
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-marker" data-id="7">x</mark>'
		);
		expect( findMarkerText( value, { ...options, id: null } ) ).toBe( '' );
	} );
} );

describe( 'markers of several format types', () => {
	const OUTER = 'test/marker-outer';
	const INNER = 'test/marker-inner';
	const both = { ...options, formatType: [ OUTER, INNER ] };

	beforeAll( () => {
		for ( const [ name, className ] of [
			[ OUTER, 'wp-marker-outer' ],
			[ INNER, 'wp-marker-inner' ],
		] ) {
			if (
				! ( select( richTextStore as any ) as any ).getFormatType(
					name
				)
			) {
				registerFormatType( name, {
					title: name,
					tagName: 'mark',
					className,
					attributes: {
						'data-id': 'data-id',
						'data-kind': 'data-kind',
					},
					edit: () => null,
				} as any );
			}
		}
	} );

	afterAll( () => {
		unregisterFormatType( OUTER );
		unregisterFormatType( INNER );
	} );

	const nested = () =>
		RichTextData.fromHTMLString(
			'a<mark class="wp-marker-outer" data-id="7" data-kind="o">bc' +
				'<mark class="wp-marker-inner" data-id="9">de</mark>' +
				'</mark><mark class="wp-marker-inner" data-id="7" data-kind="i">fg</mark>h'
		);

	it( 'resolves one id across every listed format type', () => {
		expect( findMarkerRange( nested(), { ...both, id: 7 } ) ).toEqual( {
			start: 1,
			end: 7,
		} );
		expect( findMarkerText( nested(), { ...both, id: 7 } ) ).toBe(
			'bcdefg'
		);
	} );

	it( 'still matches a single type when given a string', () => {
		expect(
			findMarkerRange( nested(), {
				...options,
				formatType: INNER,
				id: 7,
			} )
		).toEqual( { start: 5, end: 7 } );
		expect(
			findMarkerText( nested(), { ...options, formatType: INNER, id: 9 } )
		).toBe( 'de' );
	} );

	it( 'applies `match` to the marker of each listed type', () => {
		expect(
			findMarkerText( nested(), {
				...both,
				id: 7,
				match: { 'data-kind': 'i' },
			} )
		).toBe( 'fg' );
	} );
} );
