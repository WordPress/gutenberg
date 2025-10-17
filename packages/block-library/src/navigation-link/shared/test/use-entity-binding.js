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

		it( 'should return true when core/post-data binding exists with id for post-type', () => {
			const attributes = {
				metadata: {
					bindings: {
						url: {
							source: 'core/post-data',
							args: { key: 'link' },
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
							args: { key: 'link' },
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
							args: { key: 'url' },
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
							args: { key: 'link' },
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
						args: { key: 'link' },
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
					key: 'link',
				},
			},
		} );
	} );

	it( 'should create core/term-data binding when createBinding is called for taxonomy', () => {
		const attributes = {
			metadata: {},
			id: null,
			kind: 'taxonomy',
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
				source: 'core/term-data',
				args: {
					key: 'link',
				},
			},
		} );
	} );

	describe( 'clearBinding behavior', () => {
		it( 'should call updateBlockBindings when clearBinding is called and valid binding exists', () => {
			const attributes = {
				metadata: {
					bindings: {
						url: {
							source: 'core/post-data',
							args: { key: 'link' },
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

		it( 'should call updateBlockBindings when clearBinding is called and valid taxonomy binding exists', () => {
			const attributes = {
				metadata: {
					bindings: {
						url: {
							source: 'core/term-data',
							args: { key: 'link' },
						},
					},
				},
				id: 456,
				kind: 'taxonomy',
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

		it( 'should NOT call updateBlockBindings when clearBinding is called and binding exists but no id', () => {
			const attributes = {
				metadata: {
					bindings: {
						url: {
							source: 'core/post-data',
							args: { key: 'link' },
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

			act( () => {
				result.current.clearBinding();
			} );

			expect( mockUpdateBlockBindings ).not.toHaveBeenCalled();
		} );

		it( 'should call updateBlockBindings when clearBinding is called and binding exists with any source', () => {
			const attributes = {
				metadata: {
					bindings: {
						url: {
							source: 'core/post-data',
							args: { key: 'link' },
						},
					},
				},
				id: 123,
				kind: 'post-type', // Correct kind for post-data source
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
	} );

	describe( 'createBinding behavior', () => {
		it( 'should not create binding when createBinding is called without kind', () => {
			const attributes = {
				metadata: {},
				id: null,
				kind: null,
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

			expect( mockUpdateBlockBindings ).not.toHaveBeenCalled();
		} );

		it( 'should create binding with updated attributes when createBinding is called with updatedAttributes', () => {
			const attributes = {
				metadata: {},
				id: null,
				kind: 'post-type',
			};

			const updatedAttributes = {
				kind: 'taxonomy',
			};

			const { result } = renderHook( () =>
				useEntityBinding( {
					clientId: 'test-client-id',
					attributes,
				} )
			);

			act( () => {
				result.current.createBinding( updatedAttributes );
			} );

			expect( mockUpdateBlockBindings ).toHaveBeenCalledWith( {
				url: {
					source: 'core/term-data',
					args: {
						key: 'link',
					},
				},
			} );
		} );
	} );
} );
