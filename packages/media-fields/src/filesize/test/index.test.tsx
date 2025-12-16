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

			// 0 bytes returns empty string because the truthy check in getValue treats 0 as falsy
			expect( result ).toBe( '' );
		} );

		it( 'formats bytes (less than 1 KB)', () => {
			const item = {
				media_details: {
					filesize: 512,
					sizes: {},
				},
			} as MediaItem;

			const result = filesizeField.getValue?.( {
				item,
			} );

			expect( result ).toMatch( /^512\s+B$/ );
		} );

		it( 'formats kilobytes', () => {
			const item = {
				media_details: {
					filesize: 1024 * 50, // 50 KB
					sizes: {},
				},
			} as MediaItem;

			const result = filesizeField.getValue?.( {
				item,
			} );

			expect( result ).toMatch( /^50\s+KB$/ );
		} );

		it( 'formats megabytes', () => {
			const item = {
				media_details: {
					filesize: 1024 * 1024 * 5, // 5 MB
					sizes: {},
				},
			} as MediaItem;

			const result = filesizeField.getValue?.( {
				item,
			} );

			expect( result ).toMatch( /^5\s+MB$/ );
		} );

		it( 'formats gigabytes', () => {
			const item = {
				media_details: {
					filesize: 1024 * 1024 * 1024 * 2.5, // 2.5 GB
					sizes: {},
				},
			} as MediaItem;

			const result = filesizeField.getValue?.( {
				item,
			} );

			expect( result ).toMatch( /^2\.5\s+GB$/ );
		} );

		it( 'formats terabytes', () => {
			const item = {
				media_details: {
					filesize: 1024 * 1024 * 1024 * 1024 * 1.5, // 1.5 TB
					sizes: {},
				},
			} as MediaItem;

			const result = filesizeField.getValue?.( {
				item,
			} );

			expect( result ).toMatch( /^1\.5\s+TB$/ );
		} );

		it( 'formats with proper decimals for fractional sizes', () => {
			const item = {
				media_details: {
					filesize: 1024 * 1024 * 3.14159, // ~3.14 MB
					sizes: {},
				},
			} as MediaItem;

			const result = filesizeField.getValue?.( {
				item,
			} );

			// Should have at most 2 decimal places
			expect( result ).toMatch( /^3\.14\s+MB$/ );
		} );

		it( 'uses correct unit for boundary values', () => {
			const item = {
				media_details: {
					filesize: 1024, // Exactly 1 KB
					sizes: {},
				},
			} as MediaItem;

			const result = filesizeField.getValue?.( {
				item,
			} );

			expect( result ).toMatch( /^1\s+KB$/ );
		} );

		it( 'returns empty string when filesize is missing', () => {
			const item = {
				media_details: {
					sizes: {},
				},
			} as MediaItem;

			const result = filesizeField.getValue?.( {
				item,
			} );

			expect( result ).toBe( '' );
		} );

		it( 'returns empty string when media_details is missing', () => {
			const item = {} as MediaItem;

			const result = filesizeField.getValue?.( {
				item,
			} );

			expect( result ).toBe( '' );
		} );
	} );

	describe( 'isVisible', () => {
		it( 'returns true when filesize exists', () => {
			const item = {
				media_details: {
					filesize: 1024,
					sizes: {},
				},
			} as MediaItem;

			const result = filesizeField.isVisible?.( item );

			expect( result ).toBe( true );
		} );

		it( 'returns false when filesize is 0', () => {
			const item = {
				media_details: {
					filesize: 0,
					sizes: {},
				},
			} as MediaItem;

			const result = filesizeField.isVisible?.( item );

			expect( result ).toBe( false );
		} );

		it( 'returns false when filesize is missing', () => {
			const item = {
				media_details: {
					sizes: {},
				},
			} as MediaItem;

			const result = filesizeField.isVisible?.( item );

			expect( result ).toBe( false );
		} );
	} );
} );
