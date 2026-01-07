/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

// Mock WordPress dependencies before importing the hook
jest.mock( '@wordpress/compose', () => ( {
	useViewportMatch: jest.fn(),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

jest.mock( '../../../store', () => ( {
	store: 'block-editor-store',
} ) );

jest.mock( '../../../store/private-keys', () => ( {
	deviceTypeKey: '__experimentalDeviceType',
} ) );

/**
 * Internal dependencies
 */
import { useBlockVisibility } from '../use-block-visibility';

describe( 'useBlockVisibility', () => {
	const clientId = 'test-client-id';

	// Helper function to set up block and settings mocks
	const setupMocks = ( {
		blockVisibility = true,
		deviceType = 'Desktop',
	} = {} ) => {
		useSelect.mockImplementation( ( callback ) =>
			callback( () => ( {
				getBlock: () => ( {
					attributes: {
						metadata: {
							blockVisibility,
						},
					},
				} ),
				getSettings: () => ( {
					__experimentalDeviceType: deviceType,
				} ),
			} ) )
		);
	};

	// Helper function to set up viewport matches
	const setupViewport = ( { isMobileOrLarger, isMediumOrLarger } ) => {
		if (
			isMobileOrLarger !== undefined &&
			isMediumOrLarger !== undefined
		) {
			useViewportMatch
				.mockReturnValueOnce( isMobileOrLarger )
				.mockReturnValueOnce( isMediumOrLarger );
		} else {
			useViewportMatch.mockReturnValue(
				isMobileOrLarger ?? isMediumOrLarger ?? true
			);
		}
	};

	beforeEach( () => {
		// Reset all mocks before each test
		jest.clearAllMocks();
		// Enable experimental flag
		window.__experimentalHideBlocksBasedOnScreenSize = true;
	} );

	afterEach( () => {
		delete window.__experimentalHideBlocksBasedOnScreenSize;
	} );

	describe( 'Device type overrides', () => {
		it( 'should return true when deviceType is Mobile and block is hidden on mobile', () => {
			setupMocks( {
				blockVisibility: { mobile: false },
				deviceType: 'Mobile',
			} );
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when deviceType is Mobile and block is visible on mobile', () => {
			setupMocks( {
				blockVisibility: {
					mobile: true,
					tablet: false,
					desktop: false,
				},
				deviceType: 'Mobile',
			} );
			setupViewport( { isMobileOrLarger: false } );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when deviceType is Tablet and block is hidden on tablet', () => {
			setupMocks( {
				blockVisibility: { tablet: false },
				deviceType: 'Tablet',
			} );
			setupViewport( { isMobileOrLarger: false } );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should use actual viewport detection when deviceType is Desktop', () => {
			setupMocks( {
				blockVisibility: { desktop: false },
				deviceType: 'Desktop',
			} );
			setupViewport( {
				isMobileOrLarger: true,
				isMediumOrLarger: true,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );
	} );

	describe( 'Viewport detection with Desktop deviceType', () => {
		it( 'should return true when on mobile viewport and block is hidden on mobile', () => {
			setupMocks( {
				blockVisibility: { mobile: false },
				deviceType: 'Desktop',
			} );
			setupViewport( {
				isMobileOrLarger: false,
				isMediumOrLarger: false,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when on mobile viewport and block is visible on mobile', () => {
			setupMocks( {
				blockVisibility: {
					mobile: true,
					tablet: false,
					desktop: false,
				},
				deviceType: 'Desktop',
			} );
			setupViewport( {
				isMobileOrLarger: false,
				isMediumOrLarger: false,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when on tablet viewport and block is hidden on tablet', () => {
			setupMocks( {
				blockVisibility: { tablet: false },
				deviceType: 'Desktop',
			} );
			setupViewport( {
				isMobileOrLarger: true,
				isMediumOrLarger: false,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when on tablet viewport and block is visible on tablet', () => {
			setupMocks( {
				blockVisibility: {
					mobile: false,
					tablet: true,
					desktop: false,
				},
				deviceType: 'Desktop',
			} );
			setupViewport( {
				isMobileOrLarger: true,
				isMediumOrLarger: false,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when on desktop viewport and block is hidden on desktop', () => {
			setupMocks( {
				blockVisibility: { desktop: false },
				deviceType: 'Desktop',
			} );
			setupViewport( {
				isMobileOrLarger: true,
				isMediumOrLarger: true,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when on desktop viewport and block is visible on desktop', () => {
			setupMocks( {
				blockVisibility: {
					mobile: false,
					tablet: false,
					desktop: true,
				},
				deviceType: 'Desktop',
			} );
			setupViewport( {
				isMobileOrLarger: true,
				isMediumOrLarger: true,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );
	} );

	describe( 'Block visibility (hidden everywhere)', () => {
		it( 'should return true when blockVisibility is false', () => {
			setupMocks( {
				blockVisibility: false,
				deviceType: 'Desktop',
			} );
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when blockVisibility is true and no viewport restrictions', () => {
			setupMocks( {
				blockVisibility: true,
				deviceType: 'Desktop',
			} );
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return false when blockVisibility is undefined', () => {
			setupMocks( {
				blockVisibility: undefined,
				deviceType: 'Desktop',
			} );
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when blockVisibility is false regardless of viewport settings', () => {
			setupMocks( {
				blockVisibility: false,
				deviceType: 'Desktop',
			} );
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );
	} );

	describe( 'Edge cases', () => {
		it( 'should return false when no visibility settings are defined', () => {
			setupMocks( {
				blockVisibility: true,
				deviceType: 'Desktop',
			} );
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return false when metadata is missing', () => {
			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return false when block is missing', () => {
			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => null,
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should default to Desktop deviceType when not provided', () => {
			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: {
									desktop: false,
								},
							},
						},
					} ),
					getSettings: () => ( {} ), // No deviceType provided
				} ) )
			);
			setupViewport( {
				isMobileOrLarger: true,
				isMediumOrLarger: true,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );
	} );
} );
