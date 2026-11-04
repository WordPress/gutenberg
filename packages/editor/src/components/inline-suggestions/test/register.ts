import { afterEach, describe, expect, it } from 'vitest';
import { select } from '@wordpress/data';
import { store as richTextStore } from '@wordpress/rich-text';
import {
	registerSuggestionFormat,
	unregisterSuggestionFormats,
	SUGGESTION_MARKER_KINDS,
	SUGGESTION_ID_ATTRIBUTE,
	SUGGESTION_TYPE_ATTRIBUTE,
	SUGGESTION_AUTHOR_ATTRIBUTE,
} from '../';

const getFormatType = ( name: string ) =>
	( select( richTextStore as any ) as any ).getFormatType( name );

describe( 'registerSuggestionFormat', () => {
	afterEach( () => {
		unregisterSuggestionFormats();
	} );

	it( 'registers one <mark> format per marker kind, with its class token', () => {
		registerSuggestionFormat();
		for ( const { formatName, className } of Object.values(
			SUGGESTION_MARKER_KINDS
		) ) {
			const format = getFormatType( formatName );
			expect( format ).toBeTruthy();
			expect( format.tagName ).toBe( 'mark' );
			expect( format.className ).toBe( className );
		}
	} );

	it( 'declares the id, type, and author marker attributes', () => {
		registerSuggestionFormat();
		for ( const { formatName } of Object.values(
			SUGGESTION_MARKER_KINDS
		) ) {
			expect(
				Object.keys( getFormatType( formatName ).attributes )
			).toEqual(
				expect.arrayContaining( [
					SUGGESTION_ID_ATTRIBUTE,
					SUGGESTION_TYPE_ATTRIBUTE,
					SUGGESTION_AUTHOR_ATTRIBUTE,
				] )
			);
		}
	} );

	it( 'registers the given edit component on every kind', () => {
		const edit = () => null;
		registerSuggestionFormat( edit );
		for ( const { formatName } of Object.values(
			SUGGESTION_MARKER_KINDS
		) ) {
			expect( getFormatType( formatName ).edit ).toBe( edit );
		}
	} );

	it( 'is idempotent — a second call does not throw or duplicate', () => {
		registerSuggestionFormat();
		expect( () => registerSuggestionFormat() ).not.toThrow();
		expect(
			getFormatType( SUGGESTION_MARKER_KINDS.add.formatName )
		).toBeTruthy();
	} );
} );
