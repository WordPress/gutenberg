/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

jest.mock( '../hooks', () => ( {
	useSetting: jest.fn(),
} ) );

/**
 * Internal dependencies
 */
import { usePresets } from '../presets/use-presets';

const mockUseSetting = require( '../hooks' ).useSetting;

describe( 'usePresets', () => {
	const initialPresets = [
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

	function mockSettings( presets = initialPresets, base = basePresets ) {
		mockUseSetting.mockImplementation( ( path, _blockName, readFrom ) => {
			if ( readFrom === 'base' ) {
				return [ base, jest.fn() ];
			}
			return [ presets, setPresets ];
		} );
	}

	it( 'adds a preset', () => {
		mockSettings();
		const { result } = renderHook( () =>
			usePresets( 'typography.fontSizes', 'custom' )
		);
		const newPreset = {
			name: 'Large',
			slug: 'large',
			size: '20px',
		};

		act( () => {
			result.current.add( newPreset );
		} );

		expect( setPresets ).toHaveBeenCalledWith( [
			...initialPresets,
			newPreset,
		] );
	} );

	it( 'removes a preset by slug', () => {
		mockSettings();
		const { result } = renderHook( () =>
			usePresets( 'typography.fontSizes', 'custom' )
		);

		act( () => {
			result.current.remove( 'small' );
		} );

		expect( setPresets ).toHaveBeenCalledWith( [
			{ name: 'Medium', slug: 'medium', size: '16px' },
		] );
	} );

	it( 'renames a preset', () => {
		mockSettings();
		const { result } = renderHook( () =>
			usePresets( 'typography.fontSizes', 'custom' )
		);

		act( () => {
			result.current.rename( 'small', 'Tiny' );
		} );

		expect( setPresets ).toHaveBeenCalledWith( [
			{ name: 'Tiny', slug: 'small', size: '12px' },
			{ name: 'Medium', slug: 'medium', size: '16px' },
		] );
	} );

	it( 'resets a preset to its base value', () => {
		mockSettings();
		const { result } = renderHook( () =>
			usePresets( 'typography.fontSizes', 'theme' )
		);

		act( () => {
			result.current.resetToBase( 'small' );
		} );

		expect( setPresets ).toHaveBeenCalledWith( [
			{ name: 'Small', slug: 'small', size: '10px' },
			{ name: 'Medium', slug: 'medium', size: '16px' },
		] );
	} );

	it( 'does not reset when base preset is missing', () => {
		mockSettings();
		const { result } = renderHook( () =>
			usePresets( 'typography.fontSizes', 'theme' )
		);

		act( () => {
			result.current.resetToBase( 'unknown' );
		} );

		expect( setPresets ).not.toHaveBeenCalled();
	} );
} );
