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

		it( 'returns empty string when width is 0', () => {
			const item = {
				media_details: {
					width: 0,
					height: 1080,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.getValue?.( {
				item,
			} );

			expect( result ).toBe( '' );
		} );

		it( 'returns empty string when height is 0', () => {
			const item = {
				media_details: {
					width: 1920,
					height: 0,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.getValue?.( {
				item,
			} );

			expect( result ).toBe( '' );
		} );

		it( 'returns empty string when both width and height are 0', () => {
			const item = {
				media_details: {
					width: 0,
					height: 0,
					sizes: {},
				},
			} as Updatable< Attachment >;

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

		it( 'returns false when width is 0 (due to truthy check)', () => {
			const item = {
				media_details: {
					width: 0,
					height: 1080,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.isVisible?.( item );

			expect( result ).toBe( false );
		} );

		it( 'returns false when height is 0 (due to truthy check)', () => {
			const item = {
				media_details: {
					width: 1920,
					height: 0,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.isVisible?.( item );

			expect( result ).toBe( false );
		} );

		it( 'returns false when both width and height are 0', () => {
			const item = {
				media_details: {
					width: 0,
					height: 0,
					sizes: {},
				},
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.isVisible?.( item );

			expect( result ).toBe( false );
		} );
	} );
} );
