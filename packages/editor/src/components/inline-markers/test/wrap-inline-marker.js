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
import { wrapInlineMarker } from '../wrap-inline-marker';
import { findMarkerRange } from '../find-marker-range';

const FORMAT_NAME = 'test/marker';

const isRegistered = () =>
	!! select( richTextStore ).getFormatType( FORMAT_NAME );

describe( 'wrapInlineMarker', () => {
	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( FORMAT_NAME, {
				title: 'Marker',
				tagName: 'mark',
				className: 'wp-marker',
				attributes: { 'data-id': 'data-id' },
				edit: () => null,
			} );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( FORMAT_NAME );
		}
	} );

	it( 'returns null when the value is not RichTextData', () => {
		expect(
			wrapInlineMarker( 'plain string', {
				formatType: FORMAT_NAME,
				attributes: { 'data-id': '7' },
				start: 0,
				end: 5,
			} )
		).toBeNull();
		expect(
			wrapInlineMarker( undefined, {
				formatType: FORMAT_NAME,
				attributes: { 'data-id': '7' },
				start: 0,
				end: 5,
			} )
		).toBeNull();
	} );

	it( 'wraps the given range and returns a RichTextData', () => {
		const value = RichTextData.fromHTMLString( 'hello world' );
		const wrapped = wrapInlineMarker( value, {
			formatType: FORMAT_NAME,
			attributes: { 'data-id': '7' },
			start: 6,
			end: 11,
		} );
		expect( wrapped ).toBeInstanceOf( RichTextData );
		const html = wrapped.toHTMLString();
		expect( html ).toContain( 'data-id="7"' );
		expect( html ).toContain( 'world' );
	} );

	it( 'produces a marker that findMarkerRange resolves to the same range', () => {
		const value = RichTextData.fromHTMLString( 'hello world' );
		const wrapped = wrapInlineMarker( value, {
			formatType: FORMAT_NAME,
			attributes: { 'data-id': '7' },
			start: 6,
			end: 11,
		} );
		expect(
			findMarkerRange( wrapped, {
				formatType: FORMAT_NAME,
				idAttribute: 'data-id',
				id: 7,
				quickReject: 'wp-marker',
			} )
		).toEqual( { start: 6, end: 11 } );
	} );
} );
