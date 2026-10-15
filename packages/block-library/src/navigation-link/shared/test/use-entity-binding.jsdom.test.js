import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
	useBlockBindingsUtils,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	useEntityBinding,
	buildNavigationLinkEntityBinding,
} from '../use-entity-binding';

// Mock the entire @wordpress/block-editor module
vi.mock( import( '@wordpress/block-editor' ), () => ( {
	useBlockBindingsUtils: vi.fn(),
	useBlockEditingMode: vi.fn(),
} ) );

// Mock useSelect specifically to avoid needing to set up full data store
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

describe( 'useEntityBinding', () => {
	const mockUpdateBlockBindings = vi.fn();

	beforeEach( () => {
		vi.clearAllMocks();
		useBlockBindingsUtils.mockReturnValue( {
			updateBlockBindings: mockUpdateBlockBindings,
		} );
		useBlockEditingMode.mockReturnValue( 'default' );
		useSelect.mockReturnValue( true );
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

	describe( 'isBoundEntityPending', () => {
		const termBindingAttributes = {
			metadata: {
				bindings: {
					url: {
						source: 'core/term-data',
						args: { field: 'link' },
					},
				},
			},
			id: 1,
			kind: 'taxonomy',
			type: 'category',
		};

		// Runs the hook's selector against a fake core-data store.
		function mockCoreStore( { record, hasFinishedResolution } ) {
			const selectors = {
				getEntityRecord: vi.fn( () => record ),
				hasFinishedResolution: vi.fn( () => hasFinishedResolution ),
			};
			useSelect.mockImplementation( ( mapSelect ) =>
				mapSelect( () => selectors )
			);
			return selectors;
		}

		it( 'is true while the bound entity record is still loading', () => {
			mockCoreStore( {
				record: undefined,
				hasFinishedResolution: false,
			} );

			const { result } = renderHook( () =>
				useEntityBinding( {
					clientId: 'test-client-id',
					attributes: termBindingAttributes,
				} )
			);

			expect( result.current.isBoundEntityPending ).toBe( true );
			expect( result.current.isBoundEntityAvailable ).toBe( true );
		} );

		it( 'is false once the bound entity record has loaded', () => {
			mockCoreStore( {
				record: { id: 1, name: 'Uncategorized' },
				hasFinishedResolution: true,
			} );

			const { result } = renderHook( () =>
				useEntityBinding( {
					clientId: 'test-client-id',
					attributes: termBindingAttributes,
				} )
			);

			expect( result.current.isBoundEntityPending ).toBe( false );
			expect( result.current.isBoundEntityAvailable ).toBe( true );
		} );

		it( 'is false when the bound entity was deleted, so it still reads as missing', () => {
			mockCoreStore( { record: undefined, hasFinishedResolution: true } );

			const { result } = renderHook( () =>
				useEntityBinding( {
					clientId: 'test-client-id',
					attributes: termBindingAttributes,
				} )
			);

			expect( result.current.isBoundEntityPending ).toBe( false );
			expect( result.current.isBoundEntityAvailable ).toBe( false );
		} );

		it( 'is false when the link has no binding', () => {
			mockCoreStore( {
				record: undefined,
				hasFinishedResolution: false,
			} );

			const { result } = renderHook( () =>
				useEntityBinding( {
					clientId: 'test-client-id',
					attributes: { metadata: {}, id: null },
				} )
			);

			expect( result.current.isBoundEntityPending ).toBe( false );
		} );

		it( 'checks the resolution of post_tag for a tag link', () => {
			const selectors = mockCoreStore( {
				record: undefined,
				hasFinishedResolution: false,
			} );

			const { result } = renderHook( () =>
				useEntityBinding( {
					clientId: 'test-client-id',
					attributes: { ...termBindingAttributes, type: 'tag' },
				} )
			);

			expect( selectors.hasFinishedResolution ).toHaveBeenCalledWith(
				'getEntityRecord',
				[ 'taxonomy', 'post_tag', 1 ]
			);
			expect( result.current.isBoundEntityPending ).toBe( true );
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

			expect( console ).toHaveWarnedWith(
				'Failed to create entity binding:',
				expect.stringContaining( 'Invalid kind "invalid-kind"' )
			);

			// Should not call updateBlockBindings when validation fails
			expect( mockUpdateBlockBindings ).not.toHaveBeenCalled();
		} );
	} );
} );
