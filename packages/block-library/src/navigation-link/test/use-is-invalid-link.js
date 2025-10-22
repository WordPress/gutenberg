/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

// Mock the WordPress dependencies before importing
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockEditingMode: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useBlockEditingMode } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useIsInvalidLink } from '../use-is-invalid-link';

describe( 'useIsInvalidLink', () => {
	const mockUseSelect = useSelect;
	const mockUseBlockEditingMode = useBlockEditingMode;

	beforeEach( () => {
		jest.clearAllMocks();
		mockUseBlockEditingMode.mockReturnValue( 'default' );
	} );

	describe( 'Post-type validation', () => {
		it( 'should mark published post as valid (not invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { status: 'publish' },
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'post', 123, true )
			);

			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should mark trashed post as invalid (invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { status: 'trash' },
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'post', 123, true )
			);

			expect( result.current ).toEqual( [ true, false ] );
		} );

		it( 'should mark draft post as draft (not invalid, is draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { status: 'draft' },
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'post', 123, true )
			);

			expect( result.current ).toEqual( [ false, true ] );
		} );

		it( 'should mark published page as valid (not invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { status: 'publish' },
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'page', 456, true )
			);

			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should mark trashed page as invalid (invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { status: 'trash' },
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'page', 456, true )
			);

			expect( result.current ).toEqual( [ true, false ] );
		} );

		it( 'should mark draft page as draft (not invalid, is draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { status: 'draft' },
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'page', 456, true )
			);

			expect( result.current ).toEqual( [ false, true ] );
		} );

		it( 'should mark published custom post type as valid (not invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { status: 'publish' },
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'product', 789, true )
			);

			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should mark trashed custom post type as invalid (invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { status: 'trash' },
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'product', 789, true )
			);

			expect( result.current ).toEqual( [ true, false ] );
		} );

		it( 'should mark draft custom post type as draft (not invalid, is draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { status: 'draft' },
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'product', 789, true )
			);

			expect( result.current ).toEqual( [ false, true ] );
		} );
	} );

	describe( 'Taxonomy validation', () => {
		it( 'should mark existing category as valid (not invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { id: 1, name: 'News' },
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'taxonomy', 'category', 1, true )
			);

			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should mark non-existent category as invalid (invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: null,
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'taxonomy', 'category', 999, true )
			);

			expect( result.current ).toEqual( [ true, false ] );
		} );

		it( 'should mark existing tag as valid (not invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { id: 2, name: 'Technology' },
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'taxonomy', 'tag', 2, true )
			);

			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should mark non-existent tag as invalid (invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: null,
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'taxonomy', 'tag', 999, true )
			);

			expect( result.current ).toEqual( [ true, false ] );
		} );

		it( 'should mark existing custom taxonomy as valid (not invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { id: 3, name: 'Custom Term' },
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'taxonomy', 'product_category', 3, true )
			);

			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should mark non-existent custom taxonomy as invalid (invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: null,
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'taxonomy', 'product_category', 999, true )
			);

			expect( result.current ).toEqual( [ true, false ] );
		} );
	} );

	describe( 'Loading state validation', () => {
		it( 'should not mark as invalid while post-type is loading', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: null, // Still loading
				hasResolved: false, // Not yet resolved
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'post', 123, true )
			);

			// Should not mark as invalid while loading, even if entityData is null
			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should not mark as invalid while taxonomy is loading', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: null, // Still loading
				hasResolved: false, // Not yet resolved
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'taxonomy', 'category', 123, true )
			);

			// Should not mark as invalid while loading, even if entityData is null
			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should mark as invalid only after post-type resolution completes', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { status: 'trash' }, // Trashed post
				hasResolved: true, // Resolution completed
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'post', 999, true )
			);

			// Should mark as invalid only after resolution is complete
			expect( result.current ).toEqual( [ true, false ] );
		} );

		it( 'should not mark non-existent post-type as invalid (only trashed posts are invalid)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: null, // Post doesn't exist
				hasResolved: true, // Resolution completed
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'post', 999, true )
			);

			// Non-existent posts are not marked as invalid (only trashed posts are)
			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should mark as invalid only after taxonomy resolution completes', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: null, // Term doesn't exist
				hasResolved: true, // Resolution completed
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'taxonomy', 'category', 999, true )
			);

			// Should mark as invalid only after resolution is complete
			expect( result.current ).toEqual( [ true, false ] );
		} );

		it( 'should mark as draft only after post-type resolution completes', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: { status: 'draft' }, // Draft post
				hasResolved: true, // Resolution completed
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'post', 123, true )
			);

			// Should mark as draft only after resolution is complete
			expect( result.current ).toEqual( [ false, true ] );
		} );

		it( 'should handle loading state for trashed post', () => {
			// First render: still loading
			mockUseSelect.mockImplementation( () => ( {
				entityData: null,
				hasResolved: false,
			} ) );

			const { result, rerender } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'post', 123, true )
			);

			// Should not mark as invalid while loading
			expect( result.current ).toEqual( [ false, false ] );

			// Second render: resolution complete, post is trashed
			mockUseSelect.mockImplementation( () => ( {
				entityData: { status: 'trash' },
				hasResolved: true,
			} ) );

			rerender();

			// Should now mark as invalid after resolution
			expect( result.current ).toEqual( [ true, false ] );
		} );
	} );

	describe( 'Edge cases', () => {
		it( 'should skip validation when no ID provided (not invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: null,
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'post', null, true )
			);

			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should skip validation when ID is not a number (not invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: null,
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'post', 'invalid', true )
			);

			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should skip validation when validation is disabled (not invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: null,
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'post', 123, false )
			);

			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should skip validation when block editing mode is disabled (not invalid, not draft)', () => {
			mockUseBlockEditingMode.mockReturnValue( 'disabled' );
			mockUseSelect.mockImplementation( () => ( {
				entityData: null,
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type', 'post', 123, true )
			);

			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should skip validation for custom links (not invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: null,
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'custom', 'custom', 123, true )
			);

			expect( result.current ).toEqual( [ false, false ] );
		} );

		it( 'should skip validation for post-type-archive links (not invalid, not draft)', () => {
			mockUseSelect.mockImplementation( () => ( {
				entityData: null,
				hasResolved: true,
			} ) );

			const { result } = renderHook( () =>
				useIsInvalidLink( 'post-type-archive', 'post', 123, true )
			);

			expect( result.current ).toEqual( [ false, false ] );
		} );
	} );
} );
