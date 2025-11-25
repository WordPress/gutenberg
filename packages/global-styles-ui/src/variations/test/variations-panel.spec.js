/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

// Mock the hooks and stores BEFORE importing the module under test
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

jest.mock( '../../hooks', () => ( {
	useStyle: jest.fn(),
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	store: {
		name: 'core/blocks',
	},
} ) );

jest.mock( '@wordpress/components', () => ( {
	__experimentalItemGroup: jest.fn( ( { children } ) => children ),
} ) );

/**
 * Internal dependencies
 */
import { useBlockVariations } from '../variations-panel';

describe( 'useBlockVariations', () => {
	const mockUseSelect = require( '@wordpress/data' ).useSelect;
	const mockUseStyle = require( '../../hooks' ).useStyle;
	const blocksStore = require( '@wordpress/blocks' ).store;

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return block styles with source === "block"', () => {
		const blockName = 'core/button';
		const blockStyles = [
			{
				name: 'outline',
				label: 'Outline',
				source: 'block',
			},
			{
				name: 'fill',
				label: 'Fill',
				source: 'block',
			},
		];

		mockUseSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store === blocksStore ) {
					return {
						getBlockStyles: jest
							.fn()
							.mockReturnValue( blockStyles ),
					};
				}
				return {};
			};
			return mapSelect( select );
		} );

		mockUseStyle.mockReturnValue( [ {}, jest.fn() ] );

		const { result } = renderHook( () => useBlockVariations( blockName ) );

		expect( result.current ).toEqual( blockStyles );
		expect( mockUseSelect ).toHaveBeenCalledWith( expect.any( Function ), [
			blockName,
		] );
		expect( mockUseStyle ).toHaveBeenCalledWith( 'variations', blockName );
	} );

	it( 'should return block styles that match variation names', () => {
		const blockName = 'core/button';
		const blockStyles = [
			{
				name: 'outline',
				label: 'Outline',
				source: 'theme',
			},
			{
				name: 'fill',
				label: 'Fill',
				source: 'theme',
			},
		];
		const variations = {
			outline: {},
			fill: {},
		};

		mockUseSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store === blocksStore ) {
					return {
						getBlockStyles: jest
							.fn()
							.mockReturnValue( blockStyles ),
					};
				}
				return {};
			};
			return mapSelect( select );
		} );

		mockUseStyle.mockReturnValue( [ variations, jest.fn() ] );

		const { result } = renderHook( () => useBlockVariations( blockName ) );

		expect( result.current ).toEqual( blockStyles );
	} );

	it( 'should filter out block styles that do not match source or variation names', () => {
		const blockName = 'core/button';
		const blockStyles = [
			{
				name: 'outline',
				label: 'Outline',
				source: 'block',
			},
			{
				name: 'fill',
				label: 'Fill',
				source: 'theme',
			},
			{
				name: 'custom',
				label: 'Custom',
				source: 'theme',
			},
		];
		const variations = {
			fill: {},
		};

		mockUseSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store === blocksStore ) {
					return {
						getBlockStyles: jest
							.fn()
							.mockReturnValue( blockStyles ),
					};
				}
				return {};
			};
			return mapSelect( select );
		} );

		mockUseStyle.mockReturnValue( [ variations, jest.fn() ] );

		const { result } = renderHook( () => useBlockVariations( blockName ) );

		expect( result.current ).toEqual( [
			{
				name: 'outline',
				label: 'Outline',
				source: 'block',
			},
			{
				name: 'fill',
				label: 'Fill',
				source: 'theme',
			},
		] );
		expect( result.current ).not.toContainEqual( {
			name: 'custom',
			label: 'Custom',
			source: 'theme',
		} );
	} );

	it( 'should return empty array when block styles is empty', () => {
		const blockName = 'core/button';

		mockUseSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store === blocksStore ) {
					return {
						getBlockStyles: jest.fn().mockReturnValue( [] ),
					};
				}
				return {};
			};
			return mapSelect( select );
		} );

		mockUseStyle.mockReturnValue( [ {}, jest.fn() ] );

		const { result } = renderHook( () => useBlockVariations( blockName ) );

		expect( result.current ).toEqual( [] );
	} );

	it( 'should return empty array when block styles is null', () => {
		const blockName = 'core/button';

		mockUseSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store === blocksStore ) {
					return {
						getBlockStyles: jest.fn().mockReturnValue( null ),
					};
				}
				return {};
			};
			return mapSelect( select );
		} );

		mockUseStyle.mockReturnValue( [ {}, jest.fn() ] );

		const { result } = renderHook( () => useBlockVariations( blockName ) );

		expect( result.current ).toEqual( [] );
	} );

	it( 'should return empty array when block styles is undefined', () => {
		const blockName = 'core/button';

		mockUseSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store === blocksStore ) {
					return {
						getBlockStyles: jest.fn().mockReturnValue( undefined ),
					};
				}
				return {};
			};
			return mapSelect( select );
		} );

		mockUseStyle.mockReturnValue( [ {}, jest.fn() ] );

		const { result } = renderHook( () => useBlockVariations( blockName ) );

		expect( result.current ).toEqual( [] );
	} );

	it( 'should handle empty variations object', () => {
		const blockName = 'core/button';
		const blockStyles = [
			{
				name: 'outline',
				label: 'Outline',
				source: 'block',
			},
			{
				name: 'fill',
				label: 'Fill',
				source: 'theme',
			},
		];

		mockUseSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store === blocksStore ) {
					return {
						getBlockStyles: jest
							.fn()
							.mockReturnValue( blockStyles ),
					};
				}
				return {};
			};
			return mapSelect( select );
		} );

		mockUseStyle.mockReturnValue( [ {}, jest.fn() ] );

		const { result } = renderHook( () => useBlockVariations( blockName ) );

		expect( result.current ).toEqual( [
			{
				name: 'outline',
				label: 'Outline',
				source: 'block',
			},
		] );
	} );

	it( 'should handle null variations', () => {
		const blockName = 'core/button';
		const blockStyles = [
			{
				name: 'outline',
				label: 'Outline',
				source: 'block',
			},
		];

		mockUseSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store === blocksStore ) {
					return {
						getBlockStyles: jest
							.fn()
							.mockReturnValue( blockStyles ),
					};
				}
				return {};
			};
			return mapSelect( select );
		} );

		mockUseStyle.mockReturnValue( [ null, jest.fn() ] );

		const { result } = renderHook( () => useBlockVariations( blockName ) );

		expect( result.current ).toEqual( blockStyles );
	} );

	it( 'should handle undefined variations', () => {
		const blockName = 'core/button';
		const blockStyles = [
			{
				name: 'outline',
				label: 'Outline',
				source: 'block',
			},
		];

		mockUseSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store === blocksStore ) {
					return {
						getBlockStyles: jest
							.fn()
							.mockReturnValue( blockStyles ),
					};
				}
				return {};
			};
			return mapSelect( select );
		} );

		mockUseStyle.mockReturnValue( [ undefined, jest.fn() ] );

		const { result } = renderHook( () => useBlockVariations( blockName ) );

		expect( result.current ).toEqual( blockStyles );
	} );

	it( 'should handle block styles with no source property', () => {
		const blockName = 'core/button';
		const blockStyles = [
			{
				name: 'outline',
				label: 'Outline',
			},
			{
				name: 'fill',
				label: 'Fill',
				source: 'block',
			},
		];
		const variations = {
			outline: {},
		};

		mockUseSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store === blocksStore ) {
					return {
						getBlockStyles: jest
							.fn()
							.mockReturnValue( blockStyles ),
					};
				}
				return {};
			};
			return mapSelect( select );
		} );

		mockUseStyle.mockReturnValue( [ variations, jest.fn() ] );

		const { result } = renderHook( () => useBlockVariations( blockName ) );

		expect( result.current ).toEqual( [
			{
				name: 'outline',
				label: 'Outline',
			},
			{
				name: 'fill',
				label: 'Fill',
				source: 'block',
			},
		] );
	} );

	it( 'should call useSelect with correct block name dependency', () => {
		const blockName = 'core/paragraph';

		mockUseSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store === blocksStore ) {
					return {
						getBlockStyles: jest.fn().mockReturnValue( [] ),
					};
				}
				return {};
			};
			return mapSelect( select );
		} );

		mockUseStyle.mockReturnValue( [ {}, jest.fn() ] );

		renderHook( () => useBlockVariations( blockName ) );

		expect( mockUseSelect ).toHaveBeenCalledWith( expect.any( Function ), [
			blockName,
		] );
	} );

	it( 'should call useStyle with correct path and block name', () => {
		const blockName = 'core/button';

		mockUseSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store === blocksStore ) {
					return {
						getBlockStyles: jest.fn().mockReturnValue( [] ),
					};
				}
				return {};
			};
			return mapSelect( select );
		} );

		mockUseStyle.mockReturnValue( [ {}, jest.fn() ] );

		renderHook( () => useBlockVariations( blockName ) );

		expect( mockUseStyle ).toHaveBeenCalledWith( 'variations', blockName );
	} );
} );
