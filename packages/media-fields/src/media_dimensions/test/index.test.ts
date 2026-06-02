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
				media_details: { width: 1920, height: 1080, sizes: {} },
			} as Updatable< Attachment >;

			const result = mediaDimensionsField.getValue?.( {
				item,
			} );

			expect( result ).toMatch( /1920\s*×\s*1080/ );
		} );

		it.each( [
			[
				{ media_details: { height: 1080, sizes: {} } },
				'when width is missing',
			],
			[
				{ media_details: { width: 1920, sizes: {} } },
				'when height is missing',
			],
			[
				{ media_details: { sizes: {} } },
				'when both dimensions are missing',
			],
			[ {}, 'when media_details is missing' ],
			[
				{ media_details: { width: 0, height: 1080, sizes: {} } },
				'when width is 0',
			],
			[
				{ media_details: { width: 1920, height: 0, sizes: {} } },
				'when height is 0',
			],
			[
				{ media_details: { width: 0, height: 0, sizes: {} } },
				'when both width and height are 0',
			],
		] )( 'returns empty string %s', ( item, description ) => {
			const result = mediaDimensionsField.getValue?.( {
				item: item as Updatable< Attachment >,
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
			[
				{ media_details: { width: 1920, height: 1080, sizes: {} } },
				true,
				'when both dimensions exist',
			],
			[
				{ media_details: { height: 1080, sizes: {} } },
				false,
				'when width is missing',
			],
			[
				{ media_details: { width: 1920, sizes: {} } },
				false,
				'when height is missing',
			],
			[
				{ media_details: { sizes: {} } },
				false,
				'when both dimensions are missing',
			],
			[
				{ media_details: { width: 0, height: 1080, sizes: {} } },
				false,
				'when width is 0 (due to truthy check)',
			],
			[
				{ media_details: { width: 1920, height: 0, sizes: {} } },
				false,
				'when height is 0 (due to truthy check)',
			],
			[
				{ media_details: { width: 0, height: 0, sizes: {} } },
				false,
				'when both width and height are 0',
			],
		] )( 'returns %s %s', ( item, expected, description ) => {
			const result = mediaDimensionsField.isVisible?.(
				item as Updatable< Attachment >
			);

			try {
				expect( result ).toBe( expected );
			} catch ( error ) {
				const message =
					error instanceof Error ? error.message : String( error );
				throw new Error(
					`Failed isVisible test (${ description }): ${ message }`
				);
			}
		} );
	} );
} );
