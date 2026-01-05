/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

// Mock the entire @wordpress/block-editor module
jest.mock( '@wordpress/block-editor', () => ( {
	store: {},
} ) );

// Mock the entire @wordpress/core-data module
jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

// Mock useDispatch specifically to avoid needing to set up full data store
jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	createSelector: jest.fn( ( fn ) => fn ),
	createRegistrySelector: jest.fn( ( fn ) => fn ),
	createReduxStore: jest.fn( () => ( {} ) ),
	combineReducers: jest.fn( ( reducers ) => ( state = {}, action ) => {
		const newState = {};
		Object.keys( reducers ).forEach( ( key ) => {
			newState[ key ] = reducers[ key ]( state[ key ], action );
		} );
		return newState;
	} ),
	register: jest.fn(),
} ) );

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useHandleLinkChange } from '../use-handle-link-change';
import { updateAttributes } from '../update-attributes';
import { useEntityBinding } from '../use-entity-binding';

// Mock internal dependencies
jest.mock( '../update-attributes' );
jest.mock( '../use-entity-binding' );

describe( 'useHandleLinkChange', () => {
	let mockSetAttributes;
	let mockUpdateBlockAttributes;
	let mockCreateBinding;
	let mockClearBinding;

	const clientId = 'test-client-id';

	beforeEach( () => {
		// Reset mocks
		mockSetAttributes = jest.fn();
		mockUpdateBlockAttributes = jest.fn();
		mockCreateBinding = jest.fn();
		mockClearBinding = jest.fn();

		// Mock useDispatch
		useDispatch.mockReturnValue( {
			updateBlockAttributes: mockUpdateBlockAttributes,
		} );

		// Mock useEntityBinding
		useEntityBinding.mockReturnValue( {
			hasUrlBinding: false,
			createBinding: mockCreateBinding,
			clearBinding: mockClearBinding,
		} );

		// Mock updateAttributes to simulate real behavior:
		// Call setAttributes with the new attrs and return metadata
		updateAttributes.mockImplementation( ( attrs, setAttributes ) => {
			setAttributes( attrs );
			return {
				isEntityLink: !! ( attrs.id && attrs.kind !== 'custom' ),
				attributes: attrs,
			};
		} );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'creating new entity links', () => {
		it( 'should create binding for new page link', () => {
			const attributes = {};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				id: 123,
				url: 'https://example.com/page',
				title: 'Test Page',
				kind: 'post-type',
				type: 'page',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					url: 'https://example.com/page',
					kind: 'post-type',
					type: 'page',
					id: 123,
					title: 'Test Page',
				} ),
				mockSetAttributes,
				attributes
			);
			expect( mockCreateBinding ).toHaveBeenCalledWith(
				expect.objectContaining( {
					id: 123,
					kind: 'post-type',
					type: 'page',
				} )
			);
		} );

		it( 'should create binding for new post link', () => {
			const attributes = {};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				id: 456,
				url: 'https://example.com/post',
				title: 'Test Post',
				kind: 'post-type',
				type: 'post',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					url: 'https://example.com/post',
					kind: 'post-type',
					type: 'post',
					id: 456,
					title: 'Test Post',
				} ),
				mockSetAttributes,
				attributes
			);
			expect( mockCreateBinding ).toHaveBeenCalledWith(
				expect.objectContaining( {
					id: 456,
					kind: 'post-type',
					type: 'post',
				} )
			);
		} );

		it( 'should create binding for new taxonomy link', () => {
			const attributes = {};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				id: 789,
				url: 'https://example.com/category/news',
				title: 'News',
				kind: 'taxonomy',
				type: 'category',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					url: 'https://example.com/category/news',
					kind: 'taxonomy',
					type: 'category',
					id: 789,
					title: 'News',
				} ),
				mockSetAttributes,
				attributes
			);
			expect( mockCreateBinding ).toHaveBeenCalledWith(
				expect.objectContaining( {
					id: 789,
					kind: 'taxonomy',
					type: 'category',
				} )
			);
		} );
	} );

	describe( 'creating new custom links', () => {
		it( 'should create new custom URL link with correct attributes', () => {
			updateAttributes.mockImplementation( ( attrs ) => ( {
				isEntityLink: false,
				attributes: attrs,
			} ) );

			const attributes = {};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				url: 'https://custom-url.com',
				title: 'Custom Link',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					url: 'https://custom-url.com',
					title: 'Custom Link',
					kind: undefined,
					type: undefined,
					id: undefined,
				} ),
				mockSetAttributes,
				attributes
			);
			expect( mockCreateBinding ).not.toHaveBeenCalled();
		} );

		it( 'should create mailto link with correct attributes', () => {
			updateAttributes.mockImplementation( ( attrs ) => ( {
				isEntityLink: false,
				attributes: { ...attrs, kind: 'custom' },
			} ) );

			const attributes = {};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				id: 'mailto:test@example.com',
				url: 'mailto:test@example.com',
				title: 'mailto:test@example.com',
				type: 'mailto',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					id: 'mailto:test@example.com',
					url: 'mailto:test@example.com',
					title: 'mailto:test@example.com',
					type: 'mailto',
					kind: undefined,
				} ),
				mockSetAttributes,
				attributes
			);
			expect( mockCreateBinding ).not.toHaveBeenCalled();
		} );

		it( 'should create tel link with correct attributes', () => {
			updateAttributes.mockImplementation( ( attrs ) => ( {
				isEntityLink: false,
				attributes: { ...attrs, kind: 'custom' },
			} ) );

			const attributes = {};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				id: 'tel:5555555',
				url: 'tel:5555555',
				title: 'tel:5555555',
				type: 'tel',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					id: 'tel:5555555',
					url: 'tel:5555555',
					title: 'tel:5555555',
					type: 'tel',
					kind: undefined,
				} ),
				mockSetAttributes,
				attributes
			);
			expect( mockCreateBinding ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'transitioning from entity to custom link', () => {
		it( 'should use direct store dispatch when converting bound entity to custom link', () => {
			// Mock that we have a URL binding
			useEntityBinding.mockReturnValue( {
				hasUrlBinding: true,
				createBinding: mockCreateBinding,
				clearBinding: mockClearBinding,
			} );

			const attributes = {
				id: 123,
				url: 'https://example.com/page',
				kind: 'post-type',
				type: 'page',
			};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			// Convert to custom link (no id)
			const updatedLink = {
				url: 'https://custom-url.com',
				title: 'Custom URL',
			};

			result.current( updatedLink );

			// Should clear binding first
			expect( mockClearBinding ).toHaveBeenCalled();

			// Should use direct store dispatch instead of setAttributes
			expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith(
				clientId,
				{
					url: 'https://custom-url.com',
					kind: 'custom',
					type: 'custom',
					id: undefined,
				}
			);

			// Should NOT call updateAttributes in this path
			expect( updateAttributes ).not.toHaveBeenCalled();
		} );

		it( 'should handle transition from bound page link to custom URL', () => {
			useEntityBinding.mockReturnValue( {
				hasUrlBinding: true,
				createBinding: mockCreateBinding,
				clearBinding: mockClearBinding,
			} );

			const attributes = {
				id: 456,
				url: 'https://example.com/my-page',
				label: 'My Page',
				kind: 'post-type',
				type: 'page',
			};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				url: 'https://external-site.com',
			};

			result.current( updatedLink );

			expect( mockClearBinding ).toHaveBeenCalled();
			expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith(
				clientId,
				expect.objectContaining( {
					url: 'https://external-site.com',
					kind: 'custom',
					type: 'custom',
					id: undefined,
				} )
			);
		} );
	} );

	describe( 'updating existing links', () => {
		it( 'should update entity link to another entity link', () => {
			const attributes = {
				id: 123,
				url: 'https://example.com/page-1',
				label: 'Page 1',
				kind: 'post-type',
				type: 'page',
			};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				id: 456,
				url: 'https://example.com/page-2',
				title: 'Page 2',
				kind: 'post-type',
				type: 'page',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					id: 456,
					url: 'https://example.com/page-2',
					kind: 'post-type',
					type: 'page',
				} ),
				mockSetAttributes,
				attributes
			);
			expect( mockCreateBinding ).toHaveBeenCalled();
		} );

		it( 'should preserve label when updating existing link with label', () => {
			const attributes = {
				id: 123,
				url: 'https://example.com/page',
				label: 'Custom Label',
				kind: 'post-type',
				type: 'page',
			};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				id: 456,
				url: 'https://example.com/new-page',
				title: 'New Page Title',
				kind: 'post-type',
				type: 'page',
			};

			result.current( updatedLink );

			// Should not include title in attrs when label exists
			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.not.objectContaining( {
					title: 'New Page Title',
				} ),
				mockSetAttributes,
				attributes
			);
		} );

		it( 'should include title when creating link without existing label', () => {
			const attributes = {};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				id: 123,
				url: 'https://example.com/page',
				title: 'Page Title',
				kind: 'post-type',
				type: 'page',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					title: 'Page Title',
				} ),
				mockSetAttributes,
				attributes
			);
		} );

		it( 'should include title when link has no URL and no label (new link)', () => {
			const attributes = {
				label: '',
			};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				id: 123,
				url: 'https://example.com/page',
				title: 'Page Title',
				kind: 'post-type',
				type: 'page',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					title: 'Page Title',
				} ),
				mockSetAttributes,
				attributes
			);
		} );

		it( 'should preserve label when adding URL to link with existing label but no URL', () => {
			const attributes = {
				label: 'Empty Link',
			};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				id: 123,
				url: 'https://example.com/page',
				title: 'Page Title',
				kind: 'post-type',
				type: 'page',
			};

			result.current( updatedLink );

			// Verify the attrs passed to updateAttributes don't include title
			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.not.objectContaining( {
					title: 'Page Title',
				} ),
				mockSetAttributes,
				attributes
			);

			// Verify the final result: setAttributes should be called WITHOUT title
			// This means the label 'Empty Link' will be preserved by updateAttributes
			expect( mockSetAttributes ).toHaveBeenCalledWith(
				expect.not.objectContaining( {
					title: 'Page Title',
				} )
			);
		} );

		it( 'should update custom link to another custom link', () => {
			updateAttributes.mockImplementation( ( attrs ) => ( {
				isEntityLink: false,
				attributes: { ...attrs, kind: 'custom' },
			} ) );

			const attributes = {
				url: 'https://old-custom-url.com',
				label: 'Old Custom Link',
				kind: 'custom',
			};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				url: 'https://new-custom-url.com',
				title: 'New Custom Link',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					url: 'https://new-custom-url.com',
					kind: undefined,
					type: undefined,
					id: undefined,
				} ),
				mockSetAttributes,
				attributes
			);
			expect( mockCreateBinding ).not.toHaveBeenCalled();
		} );

		it( 'should update custom link to entity link', () => {
			updateAttributes.mockImplementation( ( attrs ) => ( {
				isEntityLink: true,
				attributes: attrs,
			} ) );

			const attributes = {
				url: 'https://custom-url.com',
				label: 'Custom Link',
				kind: 'custom',
			};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				id: 123,
				url: 'https://example.com/page',
				title: 'Page Title',
				kind: 'post-type',
				type: 'page',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					id: 123,
					url: 'https://example.com/page',
					kind: 'post-type',
					type: 'page',
				} ),
				mockSetAttributes,
				attributes
			);
			expect( mockCreateBinding ).toHaveBeenCalled();
		} );
	} );

	describe( 'edge cases', () => {
		it( 'should return early if updatedLink is null', () => {
			const attributes = {};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			result.current( null );

			expect( updateAttributes ).not.toHaveBeenCalled();
			expect( mockCreateBinding ).not.toHaveBeenCalled();
			expect( mockClearBinding ).not.toHaveBeenCalled();
		} );

		it( 'should return early if updatedLink is undefined', () => {
			const attributes = {};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			result.current( undefined );

			expect( updateAttributes ).not.toHaveBeenCalled();
			expect( mockCreateBinding ).not.toHaveBeenCalled();
			expect( mockClearBinding ).not.toHaveBeenCalled();
		} );

		it( 'should handle link with only URL (no other properties)', () => {
			updateAttributes.mockImplementation( ( attrs ) => ( {
				isEntityLink: false,
				attributes: { ...attrs, kind: 'custom' },
			} ) );

			const attributes = {};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				url: 'https://example.com',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					url: 'https://example.com',
					kind: undefined,
					type: undefined,
					id: undefined,
				} ),
				mockSetAttributes,
				attributes
			);
			expect( mockCreateBinding ).not.toHaveBeenCalled();
		} );

		it( 'should not create binding for custom link even with id', () => {
			updateAttributes.mockImplementation( ( attrs ) => ( {
				isEntityLink: false,
				attributes: attrs,
			} ) );

			const attributes = {};

			const { result } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const updatedLink = {
				id: 123,
				url: 'https://example.com/page',
				title: 'Page',
				kind: 'custom',
				type: 'custom',
			};

			result.current( updatedLink );

			expect( updateAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					id: 123,
					url: 'https://example.com/page',
					kind: 'custom',
					type: 'custom',
				} ),
				mockSetAttributes,
				attributes
			);
			expect( mockCreateBinding ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'callback memoization', () => {
		it( 'should return same callback reference when dependencies do not change', () => {
			const attributes = { url: 'https://example.com' };

			const { result, rerender } = renderHook( () =>
				useHandleLinkChange( {
					clientId,
					attributes,
					setAttributes: mockSetAttributes,
				} )
			);

			const firstCallback = result.current;

			rerender();

			const secondCallback = result.current;

			expect( firstCallback ).toBe( secondCallback );
		} );

		it( 'should return new callback reference when attributes change', () => {
			let attributes = { url: 'https://example.com' };

			const { result, rerender } = renderHook(
				( { attrs } ) =>
					useHandleLinkChange( {
						clientId,
						attributes: attrs,
						setAttributes: mockSetAttributes,
					} ),
				{ initialProps: { attrs: attributes } }
			);

			const firstCallback = result.current;

			attributes = { url: 'https://different.com' };
			rerender( { attrs: attributes } );

			const secondCallback = result.current;

			expect( firstCallback ).not.toBe( secondCallback );
		} );
	} );
} );
