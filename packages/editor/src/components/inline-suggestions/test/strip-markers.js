/**
 * WordPress dependencies
 */
import {
	RichTextData,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	stripSuggestionMarkers,
	stripSuggestionMarkersFromAttributes,
} from '../strip-markers';
import { registerSuggestionFormat, SUGGESTION_FORMAT_NAME } from '../format';

const getFormatType = ( name ) => select( richTextStore ).getFormatType( name );

const del = ( id, text ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="del">${ text }</mark>`;

const add = ( id, text ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="add">${ text }</mark>`;

beforeAll( () => {
	registerSuggestionFormat();
} );

afterAll( () => {
	if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
		unregisterFormatType( SUGGESTION_FORMAT_NAME );
	}
} );

describe( 'stripSuggestionMarkers', () => {
	it( 'unwraps deletion and addition markers, keeping the text', () => {
		const html = `keep ${ del( 1, 'doomed' ) } and ${ add( 2, 'new' ) }`;
		const result = stripSuggestionMarkers( html );
		expect( result ).toBe( 'keep doomed and new' );
	} );

	it( 'keeps non-suggestion formatting inside a marker', () => {
		const html = `a ${ del( 1, '<strong>bold</strong>' ) } b`;
		expect( stripSuggestionMarkers( html ) ).toBe(
			'a <strong>bold</strong> b'
		);
	} );

	it( 'keeps a nested notes marker while removing the suggestion marker', () => {
		const html = `x ${ del(
			1,
			'with <mark class="wp-note" data-id="7">note</mark> inside'
		) } y`;
		const result = stripSuggestionMarkers( html );
		expect( result ).not.toContain( 'wp-suggestion' );
		expect( result ).toContain( 'wp-note' );
		expect( result ).toContain( 'data-id="7"' );
		expect( result ).toContain( 'note' );
	} );

	it( 'returns marker-free strings by reference', () => {
		const html = 'plain <em>text</em>';
		expect( stripSuggestionMarkers( html ) ).toBe( html );
	} );

	it( 'round-trips RichTextData values as RichTextData', () => {
		const value = RichTextData.fromHTMLString( `a ${ add( 3, 'ins' ) } b` );
		const result = stripSuggestionMarkers( value );
		expect( result ).toBeInstanceOf( RichTextData );
		expect( result.toHTMLString() ).toBe( 'a ins b' );
		// Marker-free rich values come back by reference.
		const clean = RichTextData.fromHTMLString( 'clean' );
		expect( stripSuggestionMarkers( clean ) ).toBe( clean );
	} );

	it( 'passes through non-string-like values untouched', () => {
		expect( stripSuggestionMarkers( 7 ) ).toBe( 7 );
		expect( stripSuggestionMarkers( null ) ).toBe( null );
		expect( stripSuggestionMarkers( undefined ) ).toBe( undefined );
		const obj = { level: 2 };
		expect( stripSuggestionMarkers( obj ) ).toBe( obj );
	} );
} );

describe( 'stripSuggestionMarkersFromAttributes', () => {
	it( 'strips marked string values and preserves the rest', () => {
		const attributes = {
			content: `hi ${ del( 1, 'bye' ) }`,
			level: 3,
			metadata: { noteId: [ 1 ] },
		};
		const result = stripSuggestionMarkersFromAttributes( attributes );
		expect( result.content ).toBe( 'hi bye' );
		expect( result.level ).toBe( 3 );
		expect( result.metadata ).toBe( attributes.metadata );
	} );

	it( 'returns the attributes object by reference when nothing changed', () => {
		const attributes = { content: 'clean', align: 'left' };
		expect( stripSuggestionMarkersFromAttributes( attributes ) ).toBe(
			attributes
		);
	} );

	it( 'tolerates null and undefined', () => {
		expect( stripSuggestionMarkersFromAttributes( null ) ).toBe( null );
		expect( stripSuggestionMarkersFromAttributes( undefined ) ).toBe(
			undefined
		);
	} );
} );
