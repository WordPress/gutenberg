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
import {
	useEntityBinding,
	buildNavigationLinkEntityBinding,
} from '../use-entity-binding';

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

		it( 'should return true when core/post-data binding exists with id for post-type', () => {
			const attributes = {
				metadata: {
					bindings: {
						url: {
							source: 'core/post-data',
							args: { field: 'link' },
						},
					},
				},
				id: 123,
				kind: 'post-type',
			};

			const { result } = renderHook( () =>
				useEntityBinding( {
					clientId: 'test-client-id',
					attributes,
				} )
			);

			expect( result.current.hasUrlBinding ).toBe( true );
		} );

		it( 'should return true when core/term-data binding exists with id for taxonomy', () => {
			const attributes = {
				metadata: {
					bindings: {
						url: {
							source: 'core/term-data',
							args: { field: 'link' },
						},
					},
				},
				id: 123,
				kind: 'taxonomy',
			};

			const { result } = renderHook( () =>
				useEntityBinding( {
					clientId: 'test-client-id',
					attributes,
				} )
			);

			expect( result.current.hasUrlBinding ).toBe( true );
		} );

		it( 'should return false when source is not core/post-data or core/term-data', () => {
			const attributes = {
				metadata: {
					bindings: {
						url: {
							source: 'some-other-source',
							args: { field: 'url' },
						},
					},
				},
				id: 123,
				kind: 'post-type',
			};

			const { result } = renderHook( () =>
				useEntityBinding( {
					clientId: 'test-client-id',
					attributes,
				} )
			);

			expect( result.current.hasUrlBinding ).toBe( false );
		} );

		it( 'should return false when core/post-data binding exists but no id', () => {
			const attributes = {
				metadata: {
					bindings: {
						url: {
							source: 'core/post-data',
							args: { field: 'link' },
						},
					},
				},
				id: null,
				kind: 'post-type',
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
						source: 'core/post-data',
						args: { field: 'link' },
					},
				},
			},
			id: 123,
			kind: 'post-type',
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

	it( 'should NOT call updateBlockBindings when clearBinding is called and no binding exists', () => {
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

	it( 'should call updateBlockBindings when clearBinding is called and binding exists even with null source', () => {
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

		expect( mockUpdateBlockBindings ).toHaveBeenCalledWith( {
			url: undefined,
		} );
	} );

	it( 'should create core/post-data binding when createBinding is called for post-type', () => {
		const attributes = {
			metadata: {},
			id: null,
			kind: 'post-type',
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
				source: 'core/post-data',
				args: {
					field: 'link',
				},
			},
		} );
	} );

	describe( 'buildNavigationLinkEntityBinding', () => {
		it( 'returns correct binding for post-type', () => {
			const binding = buildNavigationLinkEntityBinding( 'post-type' );
			expect( binding ).toEqual( {
				url: {
					source: 'core/post-data',
					args: { field: 'link' },
				},
			} );
		} );

		it( 'returns correct binding for taxonomy', () => {
			const binding = buildNavigationLinkEntityBinding( 'taxonomy' );
			expect( binding ).toEqual( {
				url: {
					source: 'core/term-data',
					args: { field: 'link' },
				},
			} );
		} );

		it( 'throws error when called without parameter', () => {
			expect( () => {
				buildNavigationLinkEntityBinding();
			} ).toThrow(
				'buildNavigationLinkEntityBinding requires a kind parameter'
			);
		} );

		it( 'throws error for invalid kind', () => {
			expect( () => {
				buildNavigationLinkEntityBinding( 'invalid-kind' );
			} ).toThrow( 'Invalid kind "invalid-kind"' );
		} );

		it( 'throws error for null kind', () => {
			expect( () => {
				buildNavigationLinkEntityBinding( null );
			} ).toThrow( 'Invalid kind "null"' );
		} );

		it( 'throws error for empty string', () => {
			expect( () => {
				buildNavigationLinkEntityBinding( '' );
			} ).toThrow( 'Invalid kind ""' );
		} );

		it( 'handles invalid kind gracefully in createBinding', () => {
			const consoleSpy = jest
				.spyOn( console, 'warn' )
				.mockImplementation();

			const attributes = {
				metadata: {},
				id: null,
				kind: 'invalid-kind',
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

			expect( consoleSpy ).toHaveBeenCalledWith(
				'Failed to create entity binding:',
				expect.stringContaining( 'Invalid kind "invalid-kind"' )
			);

			// Should not call updateBlockBindings when validation fails
			expect( mockUpdateBlockBindings ).not.toHaveBeenCalled();

			consoleSpy.mockRestore();
		} );
	} );
} );
