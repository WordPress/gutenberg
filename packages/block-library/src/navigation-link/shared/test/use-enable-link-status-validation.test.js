/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useEnableLinkStatusValidation } from '../use-enable-link-status-validation';

// Mock useSelect directly at the implementation level to avoid loading complex dependencies
jest.mock( '@wordpress/data/src/components/use-select', () => {
	const mock = jest.fn();
	return mock;
} );

const { useSelect } = require( '@wordpress/data' );

describe( 'useEnableLinkStatusValidation', () => {
	const mockClientId = 'test-client-id';
	const mockRootNavigationId = 'root-navigation-id';
	const mockSelectedBlockId = 'selected-block-id';

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return true when root navigation block is selected', () => {
		useSelect.mockImplementation( ( callback ) => {
			return callback( () => ( {
				getSelectedBlockClientId: () => mockRootNavigationId,
				hasSelectedInnerBlock: () => false,
				getBlockParentsByBlockName: () => [ mockRootNavigationId ],
			} ) );
		} );

		const { result } = renderHook( () =>
			useEnableLinkStatusValidation( mockClientId )
		);

		expect( result.current ).toBe( true );
	} );

	it( 'should return true when an inner block of root navigation is selected', () => {
		useSelect.mockImplementation( ( callback ) => {
			return callback( () => ( {
				getSelectedBlockClientId: () => mockSelectedBlockId,
				hasSelectedInnerBlock: ( clientId, deep ) =>
					clientId === mockRootNavigationId && deep === true,
				getBlockParentsByBlockName: () => [ mockRootNavigationId ],
			} ) );
		} );

		const { result } = renderHook( () =>
			useEnableLinkStatusValidation( mockClientId )
		);

		expect( result.current ).toBe( true );
	} );

	it( 'should return false when neither root navigation nor its inner blocks are selected', () => {
		useSelect.mockImplementation( ( callback ) => {
			return callback( () => ( {
				getSelectedBlockClientId: () => 'other-block-id',
				hasSelectedInnerBlock: () => false,
				getBlockParentsByBlockName: () => [ mockRootNavigationId ],
			} ) );
		} );

		const { result } = renderHook( () =>
			useEnableLinkStatusValidation( mockClientId )
		);

		expect( result.current ).toBe( false );
	} );

	it( 'should handle case when root navigation id is not found', () => {
		useSelect.mockImplementation( ( callback ) => {
			return callback( () => ( {
				getSelectedBlockClientId: () => mockSelectedBlockId,
				hasSelectedInnerBlock: () => false,
				getBlockParentsByBlockName: () => [],
			} ) );
		} );

		const { result } = renderHook( () =>
			useEnableLinkStatusValidation( mockClientId )
		);

		// When rootNavigationId is undefined (empty array),
		// both conditions will be false
		expect( result.current ).toBe( false );
	} );

	it( 'should update when clientId changes', () => {
		const newClientId = 'new-client-id';
		const newRootNavigationId = 'new-root-navigation-id';

		useSelect.mockImplementation( ( callback ) => {
			return callback( () => ( {
				getSelectedBlockClientId: () => newRootNavigationId,
				hasSelectedInnerBlock: () => false,
				getBlockParentsByBlockName: ( clientId ) => {
					return clientId === newClientId
						? [ newRootNavigationId ]
						: [ mockRootNavigationId ];
				},
			} ) );
		} );

		const { result, rerender } = renderHook(
			( { clientId } ) => useEnableLinkStatusValidation( clientId ),
			{
				initialProps: { clientId: mockClientId },
			}
		);

		// Initially false (different IDs)
		expect( result.current ).toBe( false );

		// Rerender with new clientId
		rerender( { clientId: newClientId } );

		// Should now be true (matching IDs)
		expect( result.current ).toBe( true );
	} );
} );
