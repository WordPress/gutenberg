/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { slimImageObject } from '../index.js';

const FILTER_NAME = 'media.slimImageObject';
const FILTER_NAMESPACE = 'test/slim-image-object';

describe( 'slimImageObject', () => {
	// Runs even when an assertion throws, so a registered filter cannot leak
	// into later tests. Removing a filter that was never added is a no-op.
	afterEach( () => {
		removeFilter( FILTER_NAME, FILTER_NAMESPACE );
	} );

	it( 'returns only the standard set of attachment fields', () => {
		const img = {
			id: 1,
			url: 'https://example.com/image.jpg',
			alt: 'A photo',
			caption: 'Caption text',
			customField: 'should not appear',
			anotherExtra: 42,
		};

		const result = slimImageObject( img );

		expect( result ).toEqual( {
			id: 1,
			url: 'https://example.com/image.jpg',
			alt: 'A photo',
			caption: 'Caption text',
		} );
		expect( result ).not.toHaveProperty( 'customField' );
		expect( result ).not.toHaveProperty( 'anotherExtra' );
	} );

	it( 'passes the full attachment to the media.slimImageObject filter', () => {
		addFilter( FILTER_NAME, FILTER_NAMESPACE, ( slimmed, img ) => {
			if ( img?.hasOwnProperty( 'custom_meta' ) ) {
				slimmed.custom_meta = img.custom_meta;
			}
			return slimmed;
		} );

		const img = {
			id: 2,
			url: 'https://example.com/img.png',
			alt: '',
			custom_meta: 'plugin-data',
		};

		const result = slimImageObject( img );

		expect( result.id ).toBe( 2 );
		expect( result.custom_meta ).toBe( 'plugin-data' );
	} );
} );
