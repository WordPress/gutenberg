/**
 * WordPress dependencies
 */
import type { Attachment, Updatable } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import mediaDimensionsField from '../index';

describe( 'mediaDimensionsField', () => {
	it( 'has correct field configuration', () => {
		expect( mediaDimensionsField ).toMatchObject( {
			id: 'media_dimensions',
			type: 'text',
			label: 'Dimensions',
			enableSorting: false,
			filterBy: false,
			readOnly: true,
		} );
	} );

	describe( 'getValue - dimension formatting', () => {
		it( 'formats dimensions with × separator', () => {
			const item = {
				media_details: {
					width: 1920,
					height: 1080,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.getValue?.( {
				item,
			} );

			expect( result ).toMatch( /1920\s*×\s*1080/ );
		} );

		it( 'formats small dimensions', () => {
			const item = {
				media_details: {
					width: 100,
					height: 50,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.getValue?.( {
				item,
			} );

			expect( result ).toMatch( /100\s*×\s*50/ );
		} );

		it( 'formats large dimensions', () => {
			const item = {
				media_details: {
					width: 4096,
					height: 2160,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.getValue?.( {
				item,
			} );

			expect( result ).toMatch( /4096\s*×\s*2160/ );
		} );

		it( 'returns empty string when width is missing', () => {
			const item = {
				media_details: {
					height: 1080,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.getValue?.( {
				item,
			} );

			expect( result ).toBe( '' );
		} );

		it( 'returns empty string when height is missing', () => {
			const item = {
				media_details: {
					width: 1920,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.getValue?.( {
				item,
			} );

			expect( result ).toBe( '' );
		} );

		it( 'returns empty string when both dimensions are missing', () => {
			const item = {
				media_details: {
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.getValue?.( {
				item,
			} );

			expect( result ).toBe( '' );
		} );

		it( 'returns empty string when media_details is missing', () => {
			const item = {} as Updatable< Attachment >;

			const result = mediaDimensionsField.getValue?.( {
				item,
			} );

			expect( result ).toBe( '' );
		} );
	} );

	describe( 'isVisible', () => {
		it( 'returns true when both dimensions exist', () => {
			const item = {
				media_details: {
					width: 1920,
					height: 1080,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.isVisible?.( item );

			expect( result ).toBe( true );
		} );

		it( 'returns false when width is missing', () => {
			const item = {
				media_details: {
					height: 1080,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.isVisible?.( item );

			expect( result ).toBe( false );
		} );

		it( 'returns false when height is missing', () => {
			const item = {
				media_details: {
					width: 1920,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.isVisible?.( item );

			expect( result ).toBe( false );
		} );

		it( 'returns false when both dimensions are missing', () => {
			const item = {
				media_details: {
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.isVisible?.( item );

			expect( result ).toBe( false );
		} );

		it( 'returns false when media_details is missing', () => {
			const item = {} as Updatable< Attachment >;

			const result = mediaDimensionsField.isVisible?.( item );

			expect( result ).toBe( false );
		} );
	} );
} );
