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

// Mock the unlock function to return useRemoteUrlData, isHashLink, and isRelativePath
jest.mock( '../../../lock-unlock', () => ( {
	unlock: jest.fn( () => ( {
		useRemoteUrlData: ( ...args ) => mockUseRemoteUrlData( ...args ),
		isHashLink: ( url ) => url?.startsWith( '#' ),
		isRelativePath: ( url ) =>
			url?.startsWith( '/' ) && ! url?.startsWith( '//' ),
	} ) ),
} ) );

/**
 * Internal dependencies
 */
import {
	computeDisplayUrl,
	computeBadges,
	useLinkPreview,
} from '../use-link-preview';

// Mock @wordpress/data
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

// Mock @wordpress/core-data
jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

describe( 'computeDisplayUrl', () => {
	describe( 'external links', () => {
		test.each( [
			[ 'www.test.com', 'URLs without protocol' ],
			[ 'google.com', 'domain-only URLs without protocol' ],
			[ 'https://google.com', 'external URLs' ],
			[ 'https://google.com/search', 'external URLs with paths' ],
		] )( 'should mark %s as external (%s)', ( url ) => {
			const result = computeDisplayUrl( { linkUrl: url } );
			expect( result ).toEqual( {
				displayUrl: url,
				isExternal: true,
			} );
		} );

		test.each( [
			[ 'www.test.com', 'URLs without protocol' ],
			[ 'google.com', 'domain-only URLs without protocol' ],
			[ 'https://google.com', 'external URLs' ],
			[ 'https://google.com/search', 'external URLs with paths' ],
		] )(
			'should mark %s as external regardless of other attributes (%s)',
			( url ) => {
				const result = computeDisplayUrl( { linkUrl: url } );
				expect( result.isExternal ).toBe( true );
			}
		);
	} );

	describe( 'internal links', () => {
		it( 'should mark relative paths as internal', () => {
			const result = computeDisplayUrl( '/page' );
			expect( result.isExternal ).toBe( false );
		} );

		it( 'should mark anchor links as internal', () => {
			const result = computeDisplayUrl( '#section' );
			expect( result.isExternal ).toBe( false );
		} );

		it( 'should treat same-origin URLs as internal', () => {
			const result = computeDisplayUrl( {
				linkUrl: 'https://example.com/my-page',
				siteUrl: 'https://example.com',
			} );
			expect( result.isExternal ).toBe( false );
		} );
	} );

	describe( 'special protocols and edge cases', () => {
		test.each( [
			[ 'mailto:test@example.com', 'mailto:test@example.com', true ],
			[ 'tel:5555555', 'tel:5555555', true ],
		] )(
			'should mark %s as external',
			( url, expectedDisplay, expectedExternal ) => {
				const result = computeDisplayUrl( { linkUrl: url } );
				expect( result ).toEqual( {
					displayUrl: expectedDisplay,
					isExternal: expectedExternal,
				} );
			}
		);

		test.each( [
			[ '', 'empty URL' ],
			[ null, 'null URL' ],
		] )( 'should handle %s', ( url ) => {
			const result = computeDisplayUrl( { linkUrl: url } );
			expect( result ).toEqual( {
				displayUrl: '',
				isExternal: false,
			} );
		} );
	} );
} );

describe( 'computeBadges', () => {
	describe( 'kind badges', () => {
		it( 'should show "External link" badge for external links', () => {
			const badges = computeBadges( {
				url: 'https://google.com',
				isExternal: true,
			} );

			expect( badges ).toContainEqual( {
				label: 'External link',
				intent: 'default',
			} );
		} );

		it( 'should show entity type badge for internal entity links', () => {
			const badges = computeBadges( {
				url: '/my-page',
				type: 'page',
				isExternal: false,
			} );

			expect( badges ).toContainEqual( {
				label: 'Page',
				intent: 'default',
			} );
		} );

		it( 'should show "Internal link" badge for hash links', () => {
			const badges = computeBadges( {
				url: '#section',
				isExternal: false,
			} );

			expect( badges ).toContainEqual( {
				label: 'Internal link',
				intent: 'default',
			} );
		} );

		it( 'should show page badge for relative paths', () => {
			const badges = computeBadges( {
				url: '/relative-path',
				isExternal: false,
			} );

			expect( badges ).toContainEqual( {
				label: 'Page',
				intent: 'default',
			} );
		} );
	} );

	describe( 'status badges', () => {
		it( 'should show "No link selected" when URL is empty', () => {
			const badges = computeBadges( {
				url: '',
			} );

			expect( badges ).toContainEqual( {
				label: 'No link selected',
				intent: 'error',
			} );
		} );

		it( 'should show "Missing page" for broken entity bindings', () => {
			const badges = computeBadges( {
				url: '/some-page',
				type: 'page',
				hasBinding: true,
				isEntityAvailable: false,
			} );

			expect( badges ).toContainEqual( {
				label: 'Missing page',
				intent: 'error',
			} );
		} );

		it( 'should show "Published" badge for published entities', () => {
			const badges = computeBadges( {
				url: '/my-page',
				type: 'page',
				entityStatus: 'publish',
			} );

			expect( badges ).toContainEqual( {
				label: 'Published',
				intent: 'success',
			} );
		} );

		it( 'should show "Draft" badge for draft entities', () => {
			const badges = computeBadges( {
				url: '/my-draft',
				type: 'post',
				entityStatus: 'draft',
			} );

			expect( badges ).toContainEqual( {
				label: 'Draft',
				intent: 'warning',
			} );
		} );
	} );
} );

it( 'should show "Internal link" badge for hash links even when type is present', () => {
	const badges = computeBadges( {
		url: '#section',
		type: 'page', // Bug: type is set from previous link
		isExternal: false,
	} );

	// Should prioritize hash link detection over type
	expect( badges ).toContainEqual( {
		label: 'Internal link',
		intent: 'default',
	} );
	// Should NOT show Page badge
	expect( badges ).not.toContainEqual( {
		label: 'Page',
		intent: 'default',
	} );
} );

test.each( [
	[ 'www.test.com', 'URLs without protocol' ],
	[ 'google.com', 'domain-only URLs without protocol' ],
	[ 'https://google.com', 'external URLs' ],
	[ 'https://google.com/search', 'external URLs with paths' ],
] )(
	'should show "External link" badge for %s even when type is present (%s)',
	( url ) => {
		const badges = computeBadges( {
			url,
			type: 'page', // Bug: type is set incorrectly
			isExternal: true,
		} );

		// Should prioritize external link detection over type
		expect( badges ).toContainEqual( {
			label: 'External link',
			intent: 'default',
		} );
		// Should NOT show Page badge
		expect( badges ).not.toContainEqual( {
			label: 'Page',
			intent: 'default',
		} );
	}
);

it( 'should show "Page" badge for internal custom links', () => {
	const badges = computeBadges( {
		url: 'http://localhost:8888/test',
		type: 'custom',
		isExternal: false,
	} );

	// Should show Page badge for internal custom links
	expect( badges ).toContainEqual( {
		label: 'Page',
		intent: 'default',
	} );
	// Should NOT show Custom badge
	expect( badges ).not.toContainEqual( {
		label: 'Custom',
		intent: 'default',
	} );
} );

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
