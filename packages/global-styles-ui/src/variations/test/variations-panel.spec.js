/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { createElement } from '@wordpress/element';

// Only mock the internal hooks - let the real blocks store work
jest.mock( '../../hooks', () => ( {
	useStyle: jest.fn(),
} ) );

jest.mock( '@wordpress/components', () => ( {
	__experimentalItemGroup: jest.fn( ( { children } ) => children ),
} ) );

/**
 * Internal dependencies
 */
import { useBlockVariations } from '../variations-panel';
import { store as blocksStore } from '@wordpress/blocks';

describe( 'useBlockVariations', () => {
	const mockUseStyle = require( '../../hooks' ).useStyle;
	let registry;

	beforeEach( () => {
		// Create a fresh registry for each test
		registry = createRegistry();
		// Register the blocks store so we can dispatch actions
		registry.register( blocksStore );
		jest.clearAllMocks();
	} );

	function renderHookWithRegistry( hook, options = {} ) {
		const Wrapper = ( { children } ) =>
			createElement( RegistryProvider, { value: registry }, children );
		return renderHook( hook, { wrapper: Wrapper, ...options } );
	}

	function registerBlockStyles( blockName, styles ) {
		registry.dispatch( blocksStore ).addBlockStyles( blockName, styles );
	}

	it( 'should return block styles with source === "block"', () => {
		const blockStyles = [
			{ name: 'outline', label: 'Outline', source: 'block' },
			{ name: 'fill', label: 'Fill', source: 'block' },
		];

		registerBlockStyles( 'core/button', blockStyles );
		mockUseStyle.mockReturnValue( [ {}, jest.fn() ] );

		const { result } = renderHookWithRegistry( () =>
			useBlockVariations( 'core/button' )
		);

		expect( result.current ).toEqual( blockStyles );
	} );

	it( 'should return block styles that match variation names', () => {
		const blockStyles = [
			{ name: 'outline', label: 'Outline', source: 'theme' },
			{ name: 'fill', label: 'Fill', source: 'theme' },
		];
		const variations = { outline: {}, fill: {} };

		registerBlockStyles( 'core/button', blockStyles );
		mockUseStyle.mockReturnValue( [ variations, jest.fn() ] );

		const { result } = renderHookWithRegistry( () =>
			useBlockVariations( 'core/button' )
		);

		expect( result.current ).toEqual( blockStyles );
	} );

	it( 'should filter out block styles that do not match source or variation names', () => {
		const blockStyles = [
			{ name: 'outline', label: 'Outline', source: 'block' },
			{ name: 'fill', label: 'Fill', source: 'theme' },
			{ name: 'custom', label: 'Custom', source: 'theme' },
		];
		const variations = { fill: {} };

		registerBlockStyles( 'core/button', blockStyles );
		mockUseStyle.mockReturnValue( [ variations, jest.fn() ] );

		const { result } = renderHookWithRegistry( () =>
			useBlockVariations( 'core/button' )
		);

		expect( result.current ).toEqual( [
			{ name: 'outline', label: 'Outline', source: 'block' },
			{ name: 'fill', label: 'Fill', source: 'theme' },
		] );
	} );

	it( 'should return empty array when block has no styles', () => {
		mockUseStyle.mockReturnValue( [ {}, jest.fn() ] );

		const { result } = renderHookWithRegistry( () =>
			useBlockVariations( 'core/button' )
		);

		expect( result.current ).toEqual( [] );
	} );

	it( 'should handle null variations', () => {
		const blockStyles = [
			{ name: 'outline', label: 'Outline', source: 'block' },
		];

		registerBlockStyles( 'core/button', blockStyles );
		mockUseStyle.mockReturnValue( [ null, jest.fn() ] );

		const { result } = renderHookWithRegistry( () =>
			useBlockVariations( 'core/button' )
		);

		expect( result.current ).toEqual( blockStyles );
	} );

	it( 'should handle undefined variations', () => {
		const blockStyles = [
			{ name: 'outline', label: 'Outline', source: 'block' },
		];

		registerBlockStyles( 'core/button', blockStyles );
		mockUseStyle.mockReturnValue( [ undefined, jest.fn() ] );

		const { result } = renderHookWithRegistry( () =>
			useBlockVariations( 'core/button' )
		);

		expect( result.current ).toEqual( blockStyles );
	} );

	it( 'should handle empty variations object', () => {
		const blockStyles = [
			{ name: 'outline', label: 'Outline', source: 'block' },
			{ name: 'fill', label: 'Fill', source: 'theme' },
		];

		registerBlockStyles( 'core/button', blockStyles );
		mockUseStyle.mockReturnValue( [ {}, jest.fn() ] );

		const { result } = renderHookWithRegistry( () =>
			useBlockVariations( 'core/button' )
		);

		expect( result.current ).toEqual( [
			{ name: 'outline', label: 'Outline', source: 'block' },
		] );
	} );

	it( 'should handle block styles with no source property', () => {
		const blockStyles = [
			{ name: 'outline', label: 'Outline' },
			{ name: 'fill', label: 'Fill', source: 'block' },
		];
		const variations = { outline: {} };

		registerBlockStyles( 'core/button', blockStyles );
		mockUseStyle.mockReturnValue( [ variations, jest.fn() ] );

		const { result } = renderHookWithRegistry( () =>
			useBlockVariations( 'core/button' )
		);

		expect( result.current ).toEqual( [
			{ name: 'outline', label: 'Outline' },
			{ name: 'fill', label: 'Fill', source: 'block' },
		] );
	} );

	it( 'should work with different block types', () => {
		const paragraphStyles = [
			{ name: 'default', label: 'Default', source: 'block' },
		];
		const buttonStyles = [
			{ name: 'outline', label: 'Outline', source: 'block' },
		];

		registerBlockStyles( 'core/paragraph', paragraphStyles );
		registerBlockStyles( 'core/button', buttonStyles );
		mockUseStyle.mockReturnValue( [ {}, jest.fn() ] );

		const { result: paragraphResult } = renderHookWithRegistry( () =>
			useBlockVariations( 'core/paragraph' )
		);

		const { result: buttonResult } = renderHookWithRegistry( () =>
			useBlockVariations( 'core/button' )
		);

		expect( paragraphResult.current ).toEqual( paragraphStyles );
		expect( buttonResult.current ).toEqual( buttonStyles );
	} );
} );
