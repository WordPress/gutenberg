/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

jest.mock( '../hooks', () => ( {
	useSetting: jest.fn(),
} ) );

/**
 * Internal dependencies
 */
import { usePresets } from '../presets/use-presets';

const mockUseSetting = require( '../hooks' ).useSetting;

describe( 'usePresets', () => {
	const presets = [
		{ name: 'Small', slug: 'small', size: '12px' },
		{ name: 'Medium', slug: 'medium', size: '16px' },
	];
	const basePresets = [
		{ name: 'Small', slug: 'small', size: '10px' },
		{ name: 'Medium', slug: 'medium', size: '14px' },
	];

	let setPresets;

	beforeEach( () => {
		setPresets = jest.fn();
		jest.clearAllMocks();
	} );

	function mockSettings( value = presets, base = basePresets ) {
		mockUseSetting.mockImplementation( ( path, blockName, readFrom ) => {
			if ( readFrom === 'base' ) {
				return [ base, jest.fn() ];
			}
			return [ value, setPresets ];
		} );
	}

	it( 'builds the origin-keyed path and returns the merged presets, base presets and setter', () => {
		mockSettings();

		const { result } = renderHook( () =>
			usePresets( 'typography.fontSizes', 'custom' )
		);

		expect( mockUseSetting ).toHaveBeenCalledWith(
			'typography.fontSizes.custom'
		);
		expect( result.current.presets ).toBe( presets );
		expect( result.current.basePresets ).toBe( basePresets );
		expect( result.current.setPresets ).toBe( setPresets );
	} );

	it( 'reads basePresets explicitly from the "base" source, not the merged one', () => {
		mockSettings();

		renderHook( () => usePresets( 'shadow.presets', 'theme' ) );

		expect( mockUseSetting ).toHaveBeenCalledWith(
			'shadow.presets.theme',
			undefined,
			'base'
		);
	} );

	it( 'defaults presets and basePresets to an empty array when unset', () => {
		mockUseSetting.mockImplementation( () => [ undefined, setPresets ] );

		const { result } = renderHook( () =>
			usePresets( 'shadow.presets', 'custom' )
		);

		expect( result.current.presets ).toEqual( [] );
		expect( result.current.basePresets ).toEqual( [] );
	} );
} );
