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
			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: {
									mobile: false,
								},
							},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Mobile',
					} ),
				} ) )
			);

			useViewportMatch.mockReturnValue( true );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when deviceType is Mobile and block is visible on mobile', () => {
			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: {
									mobile: true,
									tablet: false,
									desktop: false,
								},
							},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Mobile',
					} ),
				} ) )
			);

			useViewportMatch.mockReturnValue( false );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when deviceType is Tablet and block is hidden on tablet', () => {
			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: {
									tablet: false,
								},
							},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Tablet',
					} ),
				} ) )
			);

			useViewportMatch.mockReturnValue( false );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should use actual viewport detection when deviceType is Desktop', () => {
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
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			// Mock viewport: >= 782px (desktop)
			useViewportMatch
				.mockReturnValueOnce( true ) // isMobileOrLarger (>= 480px)
				.mockReturnValueOnce( true ); // isMediumOrLarger (>= 782px)

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );
	} );

	describe( 'Viewport detection with Desktop deviceType', () => {
		it( 'should return true when on mobile viewport and block is hidden on mobile', () => {
			// Mock viewport: < 480px (mobile)
			useViewportMatch
				.mockReturnValueOnce( false ) // isMobileOrLarger (< 480px)
				.mockReturnValueOnce( false ); // isMediumOrLarger (< 782px)

			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: {
									mobile: false,
								},
							},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when on mobile viewport and block is visible on mobile', () => {
			// Mock viewport: < 480px (mobile)
			useViewportMatch
				.mockReturnValueOnce( false ) // isMobileOrLarger (< 480px)
				.mockReturnValueOnce( false ); // isMediumOrLarger (< 782px)

			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: {
									mobile: true,
									tablet: false,
									desktop: false,
								},
							},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when on tablet viewport and block is hidden on tablet', () => {
			// Mock viewport: >= 480px and < 782px (tablet)
			useViewportMatch
				.mockReturnValueOnce( true ) // isMobileOrLarger (>= 480px)
				.mockReturnValueOnce( false ); // isMediumOrLarger (< 782px)

			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: {
									tablet: false,
								},
							},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when on tablet viewport and block is visible on tablet', () => {
			// Mock viewport: >= 480px and < 782px (tablet)
			useViewportMatch
				.mockReturnValueOnce( true ) // isMobileOrLarger (>= 480px)
				.mockReturnValueOnce( false ); // isMediumOrLarger (< 782px)

			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: {
									mobile: false,
									tablet: true,
									desktop: false,
								},
							},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when on desktop viewport and block is hidden on desktop', () => {
			// Mock viewport: >= 782px (desktop)
			useViewportMatch
				.mockReturnValueOnce( true ) // isMobileOrLarger (>= 480px)
				.mockReturnValueOnce( true ); // isMediumOrLarger (>= 782px)

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
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when on desktop viewport and block is visible on desktop', () => {
			// Mock viewport: >= 782px (desktop)
			useViewportMatch
				.mockReturnValueOnce( true ) // isMobileOrLarger (>= 480px)
				.mockReturnValueOnce( true ); // isMediumOrLarger (>= 782px)

			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: {
									mobile: false,
									tablet: false,
									desktop: true,
								},
							},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );
	} );

	describe( 'Block visibility (hidden everywhere)', () => {
		it( 'should return true when blockVisibility is false', () => {
			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: false,
							},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			useViewportMatch.mockReturnValue( true );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when blockVisibility is true and no viewport restrictions', () => {
			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: true,
							},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			useViewportMatch.mockReturnValue( true );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return false when blockVisibility is undefined', () => {
			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			useViewportMatch.mockReturnValue( true );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when blockVisibility is false regardless of viewport settings', () => {
			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: false,
								blockVisibilityBreakpoints: {
									mobile: false,
									tablet: false,
									desktop: false,
								},
							},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			useViewportMatch.mockReturnValue( true );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );
	} );

	describe( 'Edge cases', () => {
		it( 'should return false when no visibility settings are defined', () => {
			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => ( {
						attributes: {
							metadata: {
								blockVisibility: true,
							},
						},
					} ),
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			useViewportMatch.mockReturnValue( true );

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

			useViewportMatch.mockReturnValue( true );

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

			useViewportMatch.mockReturnValue( true );

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

			// Mock desktop viewport
			useViewportMatch
				.mockReturnValueOnce( true ) // isMobileOrLarger
				.mockReturnValueOnce( true ); // isMediumOrLarger

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should not hide blocks when experimental flag is disabled', () => {
			delete window.__experimentalHideBlocksBasedOnScreenSize;

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
					getSettings: () => ( {
						__experimentalDeviceType: 'Desktop',
					} ),
				} ) )
			);

			useViewportMatch
				.mockReturnValueOnce( true )
				.mockReturnValueOnce( true );

			const { result } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );
	} );

	describe( 'Memoization', () => {
		it( 'should maintain referential equality when values do not change', () => {
			// Create stable references for the mock data
			const stableBlock = {
				attributes: {
					metadata: {
						blockVisibility: true,
						blockVisibilityBreakpoints: {
							mobile: true,
						},
					},
				},
			};
			const stableSettings = {
				__experimentalDeviceType: 'Desktop',
			};

			// Mock useSelect to return the same object references on each call
			useSelect.mockImplementation( ( callback ) =>
				callback( () => ( {
					getBlock: () => stableBlock,
					getSettings: () => stableSettings,
				} ) )
			);

			useViewportMatch
				.mockReturnValueOnce( false )
				.mockReturnValueOnce( false );

			const { result, rerender } = renderHook( () =>
				useBlockVisibility( clientId )
			);

			const firstRender = result.current;

			// Mock same values for rerender
			useViewportMatch
				.mockReturnValueOnce( false )
				.mockReturnValueOnce( false );

			rerender();

			// Should maintain referential equality when data hasn't changed
			expect( result.current ).toBe( firstRender );
		} );
	} );
} );
