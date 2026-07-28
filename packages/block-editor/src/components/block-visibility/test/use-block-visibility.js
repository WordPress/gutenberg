/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useMediaQuery } from '@wordpress/compose';

// Mock WordPress dependencies before importing the hook
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useMediaQuery: jest.fn(),
} ) );

/**
 * Internal dependencies
 */
import useBlockVisibility from '../use-block-visibility';

describe( 'useBlockVisibility', () => {
	// Helper function to set up viewport matches
	const setupViewport = ( { isMobileViewport, isTabletViewport } ) => {
		if (
			isMobileViewport !== undefined &&
			isTabletViewport !== undefined
		) {
			useMediaQuery
				.mockReturnValueOnce( isMobileViewport )
				.mockReturnValueOnce( isTabletViewport );
		} else {
			useMediaQuery.mockReturnValue(
				isMobileViewport ?? isTabletViewport ?? false
			);
		}
	};

	beforeEach( () => {
		// Reset all mocks before each test
		jest.clearAllMocks();
	} );

	describe( 'Device type overrides', () => {
		it( 'should return true when deviceType is Mobile and block is hidden on mobile', () => {
			setupViewport( { isMobileViewport: false } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { mobile: false } },
					deviceType: 'mobile',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when deviceType is Mobile and block is visible on mobile', () => {
			setupViewport( { isMobileViewport: false } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: {
						viewport: {
							mobile: true,
							tablet: false,
							desktop: false,
						},
					},
					deviceType: 'mobile',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when deviceType is Tablet and block is hidden on tablet', () => {
			setupViewport( { isMobileViewport: false } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { tablet: false } },
					deviceType: 'tablet',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should use actual viewport detection when deviceType is Desktop', () => {
			setupViewport( {
				isMobileViewport: false,
				isTabletViewport: false,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { desktop: false } },
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );
	} );

	describe( 'Viewport detection with Desktop deviceType', () => {
		it( 'should return true when on mobile viewport and block is hidden on mobile', () => {
			setupViewport( {
				isMobileViewport: true,
				isTabletViewport: false,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { mobile: false } },
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when on mobile viewport and block is visible on mobile', () => {
			setupViewport( {
				isMobileViewport: true,
				isTabletViewport: false,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: {
						viewport: {
							mobile: true,
							tablet: false,
							desktop: false,
						},
					},
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when on tablet viewport and block is hidden on tablet', () => {
			setupViewport( {
				isMobileViewport: false,
				isTabletViewport: true,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { tablet: false } },
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when on tablet viewport and block is visible on tablet', () => {
			setupViewport( {
				isMobileViewport: false,
				isTabletViewport: true,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: {
						viewport: {
							mobile: false,
							tablet: true,
							desktop: false,
						},
					},
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when on desktop viewport and block is hidden on desktop', () => {
			setupViewport( {
				isMobileViewport: false,
				isTabletViewport: false,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { desktop: false } },
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when on desktop viewport and block is visible on desktop', () => {
			setupViewport( {
				isMobileViewport: false,
				isTabletViewport: false,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: {
						viewport: {
							mobile: false,
							tablet: false,
							desktop: true,
						},
					},
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should use custom viewport breakpoints for viewport detection', () => {
			setupViewport( {
				isMobileViewport: false,
				isTabletViewport: true,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { tablet: false } },
					deviceType: 'desktop',
					viewportSettings: {
						mobile: '640px',
						tablet: '960px',
					},
				} )
			);

			expect( useMediaQuery ).toHaveBeenNthCalledWith(
				1,
				'(width <= 640px)',
				window
			);
			expect( useMediaQuery ).toHaveBeenNthCalledWith(
				2,
				'(640px < width <= 960px)',
				window
			);
			expect( result.current.currentViewport ).toBe( 'tablet' );
			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should use tablet viewport detection for a single tablet breakpoint', () => {
			setupViewport( {
				isMobileViewport: false,
				isTabletViewport: true,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { tablet: false } },
					deviceType: 'desktop',
					viewportSettings: {
						tablet: '64rem',
					},
				} )
			);

			expect( useMediaQuery ).toHaveBeenNthCalledWith(
				1,
				undefined,
				window
			);
			expect( useMediaQuery ).toHaveBeenNthCalledWith(
				2,
				'(width <= 64rem)',
				window
			);
			expect( result.current.currentViewport ).toBe( 'tablet' );
			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should not use tablet viewport detection when the tablet breakpoint is not larger than mobile', () => {
			setupViewport( {
				isMobileViewport: false,
				isTabletViewport: true,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { tablet: false } },
					deviceType: 'desktop',
					viewportSettings: {
						mobile: '960px',
						tablet: '640px',
					},
				} )
			);

			expect( useMediaQuery ).toHaveBeenNthCalledWith(
				1,
				'(width <= 960px)',
				window
			);
			expect( useMediaQuery ).toHaveBeenNthCalledWith(
				2,
				undefined,
				window
			);
			expect( result.current.currentViewport ).toBe( 'desktop' );
			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );
	} );

	describe( 'Block visibility (hidden everywhere)', () => {
		it( 'should return true when blockVisibility is false', () => {
			setupViewport( { isMobileViewport: false } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: false,
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when blockVisibility is true and no viewport restrictions', () => {
			setupViewport( { isMobileViewport: false } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: true,
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return false when blockVisibility is undefined', () => {
			setupViewport( { isMobileViewport: false } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: undefined,
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when blockVisibility is false regardless of viewport settings', () => {
			setupViewport( { isMobileViewport: false } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: false,
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );
	} );

	describe( 'Edge cases', () => {
		it( 'should return false when no visibility settings are defined', () => {
			setupViewport( { isMobileViewport: false } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: true,
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return false when blockVisibility is undefined', () => {
			setupViewport( { isMobileViewport: false } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: undefined,
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should default to desktop deviceType when not provided', () => {
			setupViewport( {
				isMobileViewport: false,
				isTabletViewport: false,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { desktop: false } },
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );
	} );
} );
