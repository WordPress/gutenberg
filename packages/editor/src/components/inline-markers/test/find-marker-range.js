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
import { findMarkerRange } from '../find-marker-range';

const FORMAT_NAME = 'test/marker';

const isRegistered = () =>
	!! select( richTextStore ).getFormatType( FORMAT_NAME );

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
			} );
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
} );
