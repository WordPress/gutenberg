/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useEntityBinding } from '../use-entity-binding';

// Mock the entire @wordpress/block-editor module
jest.mock( '@wordpress/block-editor', () => ( {
	useBlockBindingsUtils: jest.fn(),
} ) );

/**
 * WordPress dependencies
 */
import { useBlockBindingsUtils } from '@wordpress/block-editor';

describe( 'useEntityBinding', () => {
	const mockUpdateBlockBindings = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
		useBlockBindingsUtils.mockReturnValue( {
			updateBlockBindings: mockUpdateBlockBindings,
		} );
	} );

	describe( 'hasUrlBinding', () => {
		it( 'should return false when no binding exists', () => {
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

		it( 'should return true when core/entity binding exists with id', () => {
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

		it( 'should return false when source is not core/entity', () => {
			const attributes = {
				metadata: {
					bindings: {
						url: {
							source: 'some-other-source',
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

			expect( result.current.hasUrlBinding ).toBe( false );
		} );

		it( 'should return false when core/entity binding exists but no id', () => {
			const attributes = {
				metadata: {
					bindings: {
						url: {
							source: 'core/entity',
							args: { key: 'url' },
						},
					},
				},
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

		it( 'should return false when binding source is null', () => {
			const attributes = {
				metadata: {
					bindings: {
						url: {
							source: null,
							args: null,
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

			expect( result.current.hasUrlBinding ).toBe( false );
		} );
	} );

	it( 'should clear binding when clearBinding is called and binding exists', () => {
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
			url: undefined,
		} );
	} );

	it( 'should NOT clear binding when clearBinding is called and no binding exists', () => {
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
			result.current.clearBinding();
		} );

		expect( mockUpdateBlockBindings ).not.toHaveBeenCalled();
	} );

	it( 'should NOT clear binding when binding metadata exists but source is null', () => {
		const attributes = {
			metadata: {
				bindings: {
					url: {
						source: null,
						args: null,
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

		expect( mockUpdateBlockBindings ).not.toHaveBeenCalled();
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
