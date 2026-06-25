/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { slimImageObject } from '../index.js';

describe( 'slimImageObject', () => {
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
		const filterName = 'media.slimImageObject';
		const namespace = 'test/slim-image-object';

		addFilter(
			filterName,
			namespace,
			( slimmed, img ) => {
				if ( img?.hasOwnProperty( 'custom_meta' ) ) {
					slimmed.custom_meta = img.custom_meta;
				}
				return slimmed;
			}
		);

		const img = {
			id: 2,
			url: 'https://example.com/img.png',
			alt: '',
			custom_meta: 'plugin-data',
		};

		const result = slimImageObject( img );

		expect( result.id ).toBe( 2 );
		expect( result.custom_meta ).toBe( 'plugin-data' );

		removeFilter( filterName, namespace );
	} );
} );
