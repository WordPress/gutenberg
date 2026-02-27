/**
 * Internal dependencies
 */
import filesizeField from '../index';
import type { MediaItem } from '../../types';

describe( 'filesizeField', () => {
	it( 'has correct field configuration', () => {
		expect( filesizeField ).toMatchObject( {
			id: 'filesize',
			type: 'text',
			label: 'File size',
			enableSorting: false,
			filterBy: false,
			readOnly: true,
		} );
	} );

	describe( 'getValue - byte formatting logic', () => {
		it( 'returns empty string for 0 bytes due to truthy check', () => {
			const item = {
				media_details: {
					filesize: 0,
					sizes: {},
				},
			} as MediaItem;

			const result = filesizeField.getValue?.( {
				item,
			} );

			expect( result ).toBe( '' );
		} );

		it.each( [
			[ 512, /^512\s+B$/, 'bytes (less than 1 KB)' ],
			[ 1024 * 50, /^50\s+KB$/, '50 kilobytes' ],
			[ 1024 * 1024 * 5, /^5\s+MB$/, '5 megabytes' ],
			[ 1024 * 1024 * 1024 * 2.5, /^2\.5\s+GB$/, '2.5 gigabytes' ],
			[ 1024 * 1024 * 1024 * 1024 * 1.5, /^1\.5\s+TB$/, '1.5 terabytes' ],
			[
				1024 * 1024 * 3.14159,
				/^3\.14\s+MB$/,
				'fractional sizes with proper decimals',
			],
			[ 1024, /^1\s+KB$/, 'boundary value (exactly 1 KB)' ],
		] )(
			'formats %s bytes correctly: %s',
			( filesize, expected, description ) => {
				const item = {
					media_details: {
						filesize,
						sizes: {},
					},
				} as MediaItem;

				const result = filesizeField.getValue?.( {
					item,
				} );

				try {
					expect( result ).toMatch( expected );
				} catch ( error ) {
					const message =
						error instanceof Error
							? error.message
							: String( error );
					throw new Error(
						`Failed to format filesize (${ description }): ${ message }`
					);
				}
			}
		);

		it.each( [
			[ { media_details: { sizes: {} } }, 'when filesize is missing' ],
			[ {}, 'when media_details is missing' ],
		] )( 'returns empty string %s', ( item, description ) => {
			const result = filesizeField.getValue?.( {
				item: item as MediaItem,
			} );

			try {
				expect( result ).toBe( '' );
			} catch ( error ) {
				const message =
					error instanceof Error ? error.message : String( error );
				throw new Error(
					`Failed getValue test (${ description }): ${ message }`
				);
			}
		} );
	} );

	describe( 'isVisible', () => {
		it.each( [
			[ { media_details: { filesize: 1024, sizes: {} } }, true ],
			[ { media_details: { filesize: 0, sizes: {} } }, false ],
			[ { media_details: { sizes: {} } }, false ],
			[ {}, false ],
		] )( 'returns %s for item %#', ( item, expected ) => {
			const result = filesizeField.isVisible?.( item as MediaItem );

			expect( result ).toBe( expected );
		} );
	} );
} );
