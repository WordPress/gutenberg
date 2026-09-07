import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import useColorPaletteEditing from '../use-color-palette-editor';
import { useGlobalStyles } from '../hooks';

vi.mock( '@wordpress/data', () => ( {
	useSelect: vi.fn(),
	useDispatch: vi.fn(),
	useRegistry: vi.fn(),
} ) );

vi.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

vi.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

vi.mock( '../hooks', () => ( {
	useGlobalStyles: vi.fn(),
} ) );

const mockCreateSuccessNotice = vi.fn();
const mockCreateErrorNotice = vi.fn();
const mockCanUser = vi.fn();

describe( 'useColorPaletteEditing', () => {
	beforeEach( () => {
		vi.clearAllMocks();

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
			setUser: vi.fn(),
			isReady: true,
		} );

		useDispatch.mockReturnValue( {
			createSuccessNotice: mockCreateSuccessNotice,
			createErrorNotice: mockCreateErrorNotice,
		} );

		useRegistry.mockReturnValue( {
			select: () => ( {
				canUser: mockCanUser,
				getEditedEntityRecord: vi.fn(),
				getEntityRecord: vi.fn(),
				__experimentalGetCurrentThemeBaseGlobalStyles: vi.fn(
					() => ( {} )
				),
			} ),
			dispatch: () => ( {
				saveEntityRecord: vi.fn(),
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
