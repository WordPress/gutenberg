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

	it( 'extracts filename from source_url', () => {
		const item: Partial< MediaItem > = {
			source_url: 'https://example.com/wp-content/uploads/2024/image.jpg',
		};

		const result = filenameField.getValue?.( {
			item: item as MediaItem,
		} );

		expect( result ).toBe( 'image.jpg' );
	} );

	it( 'has a render function', () => {
		expect( filenameField.render ).toBeDefined();
	} );
} );
