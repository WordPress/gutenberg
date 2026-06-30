/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import {
	store as richTextStore,
	unregisterFormatType,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import {
	registerSuggestionFormat,
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_CLASS,
	SUGGESTION_ID_ATTRIBUTE,
	SUGGESTION_TYPE_ATTRIBUTE,
	SUGGESTION_AUTHOR_ATTRIBUTE,
} from '../';

const getFormatType = ( name ) => select( richTextStore ).getFormatType( name );

describe( 'registerSuggestionFormat', () => {
	afterEach( () => {
		if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	it( 'registers the core/suggestion format as a wp-suggestion <mark>', () => {
		registerSuggestionFormat();
		const format = getFormatType( SUGGESTION_FORMAT_NAME );
		expect( format ).toBeTruthy();
		expect( format.tagName ).toBe( 'mark' );
		expect( format.className ).toBe( SUGGESTION_CLASS );
	} );

	it( 'declares the id, type, and author marker attributes', () => {
		registerSuggestionFormat();
		const format = getFormatType( SUGGESTION_FORMAT_NAME );
		expect( Object.keys( format.attributes ) ).toEqual(
			expect.arrayContaining( [
				SUGGESTION_ID_ATTRIBUTE,
				SUGGESTION_TYPE_ATTRIBUTE,
				SUGGESTION_AUTHOR_ATTRIBUTE,
			] )
		);
	} );

	it( 'is idempotent — a second call does not throw or duplicate', () => {
		registerSuggestionFormat();
		expect( () => registerSuggestionFormat() ).not.toThrow();
		expect( getFormatType( SUGGESTION_FORMAT_NAME ) ).toBeTruthy();
	} );
} );
