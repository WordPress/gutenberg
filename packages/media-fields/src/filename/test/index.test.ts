/**
 * Internal dependencies
 */
import filenameField from '../index';
import type { MediaItem } from '../../types';

describe( 'filenameField', () => {
	it( 'has correct field configuration', () => {
		expect( filenameField ).toMatchObject( {
			id: 'filename',
			type: 'text',
			label: 'File name',
			enableSorting: false,
			filterBy: false,
			readOnly: true,
		} );
	} );

	describe( 'getValue', () => {
		it( 'extracts filename from source_url', () => {
			const item: Partial< MediaItem > = {
				source_url:
					'https://example.com/wp-content/uploads/2024/image.jpg',
			};

			const result = filenameField.getValue?.( {
				item: item as MediaItem,
			} );

			expect( result ).toBe( 'image.jpg' );
		} );

		it( 'returns undefined when source_url is undefined', () => {
			const item: Partial< MediaItem > = {};

			const result = filenameField.getValue?.( {
				item: item as MediaItem,
			} );

			expect( result ).toBeUndefined();
		} );

		it( 'returns undefined when source_url is empty string', () => {
			const item: Partial< MediaItem > = {
				source_url: '',
			};

			const result = filenameField.getValue?.( {
				item: item as MediaItem,
			} );

			expect( result ).toBeUndefined();
		} );
	} );

	it( 'has a render function', () => {
		expect( filenameField.render ).toBeDefined();
	} );
} );
