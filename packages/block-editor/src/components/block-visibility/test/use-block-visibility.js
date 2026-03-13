/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useMediaQuery } from '@wordpress/compose';

jest.mock( '@wordpress/compose', () => ( {
	useMediaQuery: jest.fn(),
} ) );

jest.mock( '../use-block-visibility-viewports', () => ( {
	useBlockVisibilityViewports: jest.fn(),
} ) );

/**
 * Internal dependencies
 */
import useBlockVisibility from '../use-block-visibility';
import { useBlockVisibilityViewports } from '../use-block-visibility-viewports';
import { BLOCK_VISIBILITY_VIEWPORTS } from '../constants';

describe( 'useBlockVisibility', () => {
	// Helper function to set up viewport matches
	const setupViewport = ( { isMobileOrLarger, isMediumOrLarger } ) => {
		useBlockVisibilityViewports.mockReturnValue(
			BLOCK_VISIBILITY_VIEWPORTS
		);
		if (
			isMobileOrLarger !== undefined &&
			isMediumOrLarger !== undefined
		) {
			useMediaQuery
				.mockReturnValueOnce( isMobileOrLarger )
				.mockReturnValueOnce( isMediumOrLarger );
		} else {
			useMediaQuery.mockReturnValue(
				isMobileOrLarger ?? isMediumOrLarger ?? true
			);
		}
	};

	beforeEach( () => {
		// Reset all mocks before each test
		jest.clearAllMocks();
	} );

	describe( 'Device type overrides', () => {
		it( 'should return true when deviceType is Mobile and block is hidden on mobile', () => {
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { mobile: false } },
					deviceType: 'mobile',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when deviceType is Mobile and block is visible on mobile', () => {
			setupViewport( { isMobileOrLarger: false } );

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
			setupViewport( { isMobileOrLarger: false } );

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
				isMobileOrLarger: true,
				isMediumOrLarger: true,
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
				isMobileOrLarger: false,
				isMediumOrLarger: false,
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
				isMobileOrLarger: false,
				isMediumOrLarger: false,
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
				isMobileOrLarger: true,
				isMediumOrLarger: false,
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
				isMobileOrLarger: true,
				isMediumOrLarger: false,
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
				isMobileOrLarger: true,
				isMediumOrLarger: true,
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
				isMobileOrLarger: true,
				isMediumOrLarger: true,
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
	} );

	describe( 'Block visibility (hidden everywhere)', () => {
		it( 'should return true when blockVisibility is false', () => {
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: false,
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'should return false when blockVisibility is true and no viewport restrictions', () => {
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: true,
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return false when blockVisibility is undefined', () => {
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: undefined,
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return true when blockVisibility is false regardless of viewport settings', () => {
			setupViewport( { isMobileOrLarger: true } );

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
			setupViewport( { isMobileOrLarger: true } );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: true,
					deviceType: 'desktop',
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( false );
		} );

		it( 'should return false when blockVisibility is undefined', () => {
			setupViewport( { isMobileOrLarger: true } );

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
				isMobileOrLarger: true,
				isMediumOrLarger: true,
			} );

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { desktop: false } },
				} )
			);

			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );
	} );

	describe( 'Theme breakpoint overrides', () => {
		it( 'uses theme-defined mobile size for viewport detection', () => {
			useBlockVisibilityViewports.mockReturnValue( {
				...BLOCK_VISIBILITY_VIEWPORTS,
				mobile: { ...BLOCK_VISIBILITY_VIEWPORTS.mobile, size: '600px' },
			} );
			useMediaQuery
				.mockReturnValueOnce( false ) // not larger than mobile
				.mockReturnValueOnce( false ); // not larger than tablet

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { mobile: false } },
					deviceType: 'desktop',
				} )
			);

			expect( result.current.currentViewport ).toBe( 'mobile' );
			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );

		it( 'uses theme-defined tablet size for viewport detection', () => {
			useBlockVisibilityViewports.mockReturnValue( {
				...BLOCK_VISIBILITY_VIEWPORTS,
				tablet: { ...BLOCK_VISIBILITY_VIEWPORTS.tablet, size: '900px' },
			} );
			useMediaQuery
				.mockReturnValueOnce( true ) // larger than mobile
				.mockReturnValueOnce( false ); // not larger than tablet

			const { result } = renderHook( () =>
				useBlockVisibility( {
					blockVisibility: { viewport: { tablet: false } },
					deviceType: 'desktop',
				} )
			);

			expect( result.current.currentViewport ).toBe( 'tablet' );
			expect( result.current.isBlockCurrentlyHidden ).toBe( true );
		} );
	} );
} );
