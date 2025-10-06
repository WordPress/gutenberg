/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useBlockBindingsUtils } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useEntityBinding } from '../use-entity-binding';

// Mock the useBlockBindingsUtils hook
jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockBindingsUtils: jest.fn(),
} ) );

describe( 'useEntityBinding', () => {
	const mockUpdateBlockBindings = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
		useBlockBindingsUtils.mockReturnValue( {
			updateBlockBindings: mockUpdateBlockBindings,
		} );
	} );

	it( 'should return hasUrlBinding as false when no binding exists', () => {
		const attributes = {
			metadata: {},
			id: null,
		};

		const { result } = renderHook( () =>
			useEntityBinding( {
				clientId: 'test-client-id',
				attributes,
			} )
		);

		expect( result.current.hasUrlBinding ).toBe( false );
	} );

	it( 'should return hasUrlBinding as true when binding exists', () => {
		const attributes = {
			metadata: {
				bindings: {
					url: {
						source: 'core/entity',
						args: { key: 'url' },
					},
				},
			},
			id: 123,
		};

		const { result } = renderHook( () =>
			useEntityBinding( {
				clientId: 'test-client-id',
				attributes,
			} )
		);

		expect( result.current.hasUrlBinding ).toBe( true );
	} );

	it( 'should clear binding when clearBinding is called', () => {
		const attributes = {
			metadata: {
				bindings: {
					url: {
						source: 'core/entity',
						args: { key: 'url' },
					},
				},
			},
			id: 123,
		};

		const { result } = renderHook( () =>
			useEntityBinding( {
				clientId: 'test-client-id',
				attributes,
			} )
		);

		act( () => {
			result.current.clearBinding();
		} );

		expect( mockUpdateBlockBindings ).toHaveBeenCalledWith( {
			url: {
				source: null,
				args: null,
			},
		} );
	} );

	it( 'should create binding when createBinding is called', () => {
		const attributes = {
			metadata: {},
			id: null,
		};

		const { result } = renderHook( () =>
			useEntityBinding( {
				clientId: 'test-client-id',
				attributes,
			} )
		);

		act( () => {
			result.current.createBinding();
		} );

		expect( mockUpdateBlockBindings ).toHaveBeenCalledWith( {
			url: {
				source: 'core/entity',
				args: {
					key: 'url',
				},
			},
		} );
	} );
} );
