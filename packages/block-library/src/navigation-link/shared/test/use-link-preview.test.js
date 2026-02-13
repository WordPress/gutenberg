/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

// Mock useRemoteUrlData from block-editor
const mockUseRemoteUrlData = jest.fn();

jest.mock( '@wordpress/block-editor', () => ( {
	privateApis: {},
	store: {},
} ) );

// Mock the unlock function to return useRemoteUrlData
jest.mock( '../../../lock-unlock', () => ( {
	unlock: jest.fn( () => ( {
		useRemoteUrlData: ( ...args ) => mockUseRemoteUrlData( ...args ),
	} ) ),
} ) );

/**
 * Internal dependencies
 */
import { useLinkPreview } from '../use-link-preview';

// Mock @wordpress/data
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

// Mock @wordpress/core-data
jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

describe( 'useLinkPreview', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseRemoteUrlData.mockReturnValue( { richData: null } );
		useSelect.mockReturnValue( null );
	} );

	describe( 'title computation', () => {
		it( 'should use entityRecord.title.rendered when available', () => {
			const { result } = renderHook( () =>
				useLinkPreview( {
					url: 'https://example.com',
					entityRecord: { title: { rendered: 'Test Page' } },
					type: 'page',
					hasBinding: false,
					isEntityAvailable: true,
				} )
			);

			expect( result.current.title ).toBe( 'Test Page' );
		} );

		it( 'should use entityRecord.title string when rendered not available', () => {
			const { result } = renderHook( () =>
				useLinkPreview( {
					url: 'https://example.com',
					entityRecord: { title: 'Test Category' },
					type: 'category',
					hasBinding: false,
					isEntityAvailable: true,
				} )
			);

			expect( result.current.title ).toBe( 'Test Category' );
		} );

		it( 'should use entityRecord.name for taxonomy terms', () => {
			const { result } = renderHook( () =>
				useLinkPreview( {
					url: 'https://example.com',
					entityRecord: { name: 'Test Tag' },
					type: 'tag',
					hasBinding: false,
					isEntityAvailable: true,
				} )
			);

			expect( result.current.title ).toBe( 'Test Tag' );
		} );

		it( 'should use richData title when entity title not available', () => {
			mockUseRemoteUrlData.mockReturnValue( {
				richData: { title: 'External Site Title' },
			} );

			const { result } = renderHook( () =>
				useLinkPreview( {
					url: 'https://external.com',
					entityRecord: null,
					type: null,
					hasBinding: false,
					isEntityAvailable: false,
				} )
			);

			expect( result.current.title ).toBe( 'External Site Title' );
		} );

		it( 'should use URL when no title available', () => {
			const { result } = renderHook( () =>
				useLinkPreview( {
					url: 'https://example.com/page',
					entityRecord: null,
					type: null,
					hasBinding: false,
					isEntityAvailable: false,
				} )
			);

			expect( result.current.title ).toBe( 'https://example.com/page' );
		} );

		it( 'should return "Add link" when no URL provided', () => {
			const { result } = renderHook( () =>
				useLinkPreview( {
					url: '',
					entityRecord: null,
					type: null,
					hasBinding: false,
					isEntityAvailable: false,
				} )
			);

			expect( result.current.title ).toBe( 'Add link' );
		} );
	} );

	describe( 'URL computation', () => {
		it( 'should return a URL string', () => {
			const { result } = renderHook( () =>
				useLinkPreview( {
					url: 'https://example.com/about',
					entityRecord: null,
					type: 'page',
					hasBinding: false,
					isEntityAvailable: true,
				} )
			);

			expect( typeof result.current.url ).toBe( 'string' );
			expect( result.current.url.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'image computation', () => {
		it( 'should fetch featured image when featured_media is available', () => {
			const mockMedia = {
				media_details: {
					sizes: {
						thumbnail: {
							source_url: 'https://example.com/thumb.jpg',
						},
					},
				},
			};

			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getEntityRecord: () => mockMedia,
				} ) )
			);

			const { result } = renderHook( () =>
				useLinkPreview( {
					url: 'https://example.com',
					entityRecord: { featured_media: 123 },
					type: 'page',
					hasBinding: false,
					isEntityAvailable: true,
				} )
			);

			expect( result.current.image ).toBe(
				'https://example.com/thumb.jpg'
			);
		} );

		it( 'should return null when no featured_media', () => {
			useSelect.mockReturnValue( null );

			const { result } = renderHook( () =>
				useLinkPreview( {
					url: 'https://example.com',
					entityRecord: { title: 'Test' },
					type: 'page',
					hasBinding: false,
					isEntityAvailable: true,
				} )
			);

			expect( result.current.image ).toBeNull();
		} );
	} );

	describe( 'badges computation', () => {
		it( 'should show "No link selected" badge when no URL', () => {
			const { result } = renderHook( () =>
				useLinkPreview( {
					url: '',
					entityRecord: null,
					type: null,
					hasBinding: false,
					isEntityAvailable: false,
				} )
			);

			expect( result.current.badges ).toContainEqual( {
				label: 'No link selected',
				intent: 'error',
			} );
		} );

		it( 'should show entity type badge when type is provided', () => {
			const { result } = renderHook( () =>
				useLinkPreview( {
					url: 'https://example.com/page',
					entityRecord: { title: 'Test' },
					type: 'page',
					hasBinding: false,
					isEntityAvailable: true,
				} )
			);

			// Should have at least one badge
			expect( result.current.badges.length ).toBeGreaterThan( 0 );
		} );

		it( 'should show "Missing" badge when entity is not available', () => {
			const { result } = renderHook( () =>
				useLinkPreview( {
					url: 'https://example.com',
					entityRecord: null,
					type: 'page',
					hasBinding: true,
					isEntityAvailable: false,
				} )
			);

			expect( result.current.badges ).toContainEqual( {
				label: 'Missing page',
				intent: 'error',
			} );
		} );

		it( 'should include badges when entity has status', () => {
			const { result } = renderHook( () =>
				useLinkPreview( {
					url: 'https://example.com/post',
					entityRecord: { status: 'draft', title: 'Test' },
					type: 'post',
					hasBinding: false,
					isEntityAvailable: true,
				} )
			);

			// Just verify badges array exists and has items
			expect( Array.isArray( result.current.badges ) ).toBe( true );
			expect( result.current.badges.length ).toBeGreaterThan( 0 );
		} );
	} );
} );
