/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useThemeStyleVariationsByProperty, {
	getVariationsByProperty,
} from '../use-theme-style-variations-by-property';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/element', () => {
	return {
		__esModule: true,
		...jest.requireActual( '@wordpress/element' ),
		useContext: jest.fn().mockImplementation( () => ( {
			user: {
				styles: {
					typography: {
						'font-size': '12px',
						'line-height': '1.5',
					},
					color: {
						'background-color': 'red',
						color: 'blue',
					},
				},
				settings: {
					typography: {
						'font-size': '14px',
						'line-height': '1.6',
					},
					color: {
						'background-color': 'green',
						color: 'yellow',
					},
				},
			},
		} ) ),
	};
} );

describe( 'useThemeStyleVariationsByProperty', () => {
	const mockVariations = [
		{
			title: 'Title 1',
			description: 'Description 1',
			settings: {},
			styles: {
				typography: {
					'letter-spacing': '3px',
				},
				color: {
					'background-color': 'red',
					color: 'orange',
				},
			},
		},
		{
			title: 'Title 2',
			description: 'Description 2',
			settings: {},
			styles: {
				typography: {
					'letter-spacing': '1px',
				},
				color: {
					color: 'pink',
				},
			},
		},
	];

	it( "should return the variation's typography properties", () => {
		useSelect.mockImplementation( () => mockVariations );
		const { result } = renderHook( () =>
			useThemeStyleVariationsByProperty( { styleProperty: 'typography' } )
		);
		expect( result.current ).toEqual( [
			{
				description: 'Description 1',
				settings: {},
				styles: {
					typography: { 'letter-spacing': '3px' },
				},
				title: 'Title 1',
			},
			{
				description: 'Description 2',
				settings: {},
				styles: {
					typography: { 'letter-spacing': '1px' },
				},
				title: 'Title 2',
			},
		] );
	} );
} );
