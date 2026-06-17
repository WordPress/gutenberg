/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useColorPaletteEditing from '../use-color-palette-editor';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	useRegistry: jest.fn(),
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '../hooks', () => ( {
	useGlobalStyles: jest.fn(),
} ) );

const { useGlobalStyles } = require( '../hooks' );

const mockCreateSuccessNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockCanUser = jest.fn();

describe( 'useColorPaletteEditing', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		useGlobalStyles.mockReturnValue( {
			merged: {
				settings: {
					color: {
						palette: {
							theme: [ { slug: 'brand', color: '#0073aa' } ],
						},
					},
				},
			},
			setUser: jest.fn(),
			isReady: true,
		} );

		useDispatch.mockReturnValue( {
			createSuccessNotice: mockCreateSuccessNotice,
			createErrorNotice: mockCreateErrorNotice,
		} );

		useRegistry.mockReturnValue( {
			select: () => ( {
				canUser: mockCanUser,
				getEditedEntityRecord: jest.fn(),
				getEntityRecord: jest.fn(),
				__experimentalGetCurrentThemeBaseGlobalStyles: jest.fn(
					() => ( {} )
				),
			} ),
			dispatch: () => ( {
				saveEntityRecord: jest.fn(),
			} ),
		} );

		useSelect.mockImplementation( ( selector ) => {
			const select = ( store ) => {
				if ( store === 'core' ) {
					return {
						__experimentalGetCurrentGlobalStylesId: () => 'gs-1',
						canUser: mockCanUser,
					};
				}
				return {};
			};
			return selector( select );
		} );
	} );

	it( 'returns colorEditing with capabilities and callbacks when permitted', () => {
		mockCanUser.mockReturnValue( true );

		const { result } = renderHook( () => useColorPaletteEditing() );

		expect( result.current.colorEditing ).toEqual(
			expect.objectContaining( {
				capabilities: expect.objectContaining( {
					custom: 'full',
					theme: 'value',
				} ),
				onAdd: expect.any( Function ),
				onUpdate: expect.any( Function ),
				onDelete: expect.any( Function ),
			} )
		);
		expect( result.current.colorEditing ).not.toHaveProperty( 'onPreview' );
	} );

	it( 'does not call canUser with an id when global styles id is absent', () => {
		useSelect.mockImplementation( ( selector ) => {
			const select = ( store ) => {
				if ( store === 'core' ) {
					return {
						__experimentalGetCurrentGlobalStylesId: () => null,
						canUser: mockCanUser,
					};
				}
				return {};
			};
			return selector( select );
		} );

		const { result } = renderHook( () => useColorPaletteEditing() );

		expect( result.current.colorEditing ).toBeUndefined();
		expect( mockCanUser ).not.toHaveBeenCalled();
	} );
} );
