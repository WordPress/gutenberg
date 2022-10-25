/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useMediaQuery } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ResponsiveWrapper from '../responsive-wrapper';

// Mock block-editor to avoid private API issues
jest.mock( '@wordpress/block-editor', () => ( {
	getColorClassName: jest.fn( () => '' ),
} ) );

jest.mock( '@wordpress/compose', () => ( {
	useMediaQuery: jest.fn(),
} ) );

// Mock core-data store
jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

// Mock useSelect
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
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

describe( 'ResponsiveWrapper', () => {
	const mockOnToggle = jest.fn();
	const mockOnNavigateToEntityRecord = jest.fn();

	const defaultProps = {
		id: 'test-navigation',
		isOpen: false,
		isResponsive: true,
		onToggle: mockOnToggle,
		isHiddenByDefault: false,
		overlayBackgroundColor: {},
		overlayTextColor: {},
		hasIcon: false,
		icon: null,
		overlay: undefined,
		onNavigateToEntityRecord: undefined,
		children: <div>Navigation content</div>,
	};

	beforeEach( () => {
		jest.clearAllMocks();
		useMediaQuery.mockReturnValue( false );
		// Mock useSelect - component calls: select( coreStore ).getCurrentTheme()?.stylesheet
		useSelect.mockImplementation( ( selector ) => {
			if ( typeof selector === 'function' ) {
				const mockSelect = () => ( {
					getCurrentTheme: () => ( {
						stylesheet: 'twentytwentyfive',
					} ),
				} );
				return selector( mockSelect );
			}
			return 'twentytwentyfive';
		} );
	} );

	describe( 'Custom mobile breakpoints', () => {
		it( 'preserves the default breakpoint behavior without desktop state classes', () => {
			useMediaQuery.mockReturnValue( true );

			render(
				<ResponsiveWrapper
					{ ...defaultProps }
					mobileBreakpoint="600px"
				/>
			);

			expect( useMediaQuery ).toHaveBeenCalledWith(
				'(min-width: 600px)'
			);
			expect(
				screen.getByRole( 'button', { name: 'Menu' } )
			).not.toHaveClass( 'is-custom-mobile-breakpoint-desktop' );
			expect(
				document.querySelector(
					'.wp-block-navigation__responsive-container'
				)
			).not.toHaveClass( 'is-custom-mobile-breakpoint-desktop' );
		} );

		it( 'adds desktop state classes when the custom breakpoint matches', () => {
			useMediaQuery.mockReturnValue( true );

			render(
				<ResponsiveWrapper
					{ ...defaultProps }
					mobileBreakpoint="48rem"
					hasCustomMobileBreakpoint
				/>
			);

			expect( useMediaQuery ).toHaveBeenCalledWith(
				'(min-width: 48rem)'
			);
			expect(
				screen.getByRole( 'button', { name: 'Menu' } )
			).toHaveClass( 'is-custom-mobile-breakpoint-desktop' );
			expect(
				document.querySelector(
					'.wp-block-navigation__responsive-container'
				)
			).toHaveClass( 'is-custom-mobile-breakpoint-desktop' );
		} );

		it( 'keeps mobile state classes when the custom breakpoint does not match', () => {
			useMediaQuery.mockReturnValue( false );

			render(
				<ResponsiveWrapper
					{ ...defaultProps }
					mobileBreakpoint="48rem"
					hasCustomMobileBreakpoint
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'Menu' } )
			).not.toHaveClass( 'is-custom-mobile-breakpoint-desktop' );
			expect(
				document.querySelector(
					'.wp-block-navigation__responsive-container'
				)
			).not.toHaveClass( 'is-custom-mobile-breakpoint-desktop' );
		} );
	} );

	describe( 'Overlay navigation', () => {
		it( 'should navigate to custom overlay template part when custom overlay slug is provided', async () => {
			const user = userEvent.setup();

			render(
				<ResponsiveWrapper
					{ ...defaultProps }
					overlay="my-overlay"
					onNavigateToEntityRecord={ mockOnNavigateToEntityRecord }
				/>
			);

			const openButton = screen.getByRole( 'button', {
				name: 'Menu',
			} );

			await user.click( openButton );

			// Should construct full ID from current theme and slug
			expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
				postId: 'twentytwentyfive//my-overlay',
				postType: 'wp_template_part',
			} );
			// Should not open default overlay when custom overlay is present
			expect( mockOnToggle ).not.toHaveBeenCalled();
		} );

		it( 'should open the default overlay when no custom overlay is provided', async () => {
			const user = userEvent.setup();

			render( <ResponsiveWrapper { ...defaultProps } /> );

			const openButton = screen.getByRole( 'button', {
				name: 'Menu',
			} );

			await user.click( openButton );

			// Should open the default overlay when no custom overlay
			expect( mockOnToggle ).toHaveBeenCalledWith( true );
			expect( mockOnNavigateToEntityRecord ).not.toHaveBeenCalled();
		} );

		it( 'should open the default overlay when custom overlay is provided but navigation is not available', async () => {
			const user = userEvent.setup();

			render(
				<ResponsiveWrapper
					{ ...defaultProps }
					overlay="my-overlay"
					onNavigateToEntityRecord={ undefined }
				/>
			);

			const openButton = screen.getByRole( 'button', {
				name: 'Menu',
			} );

			await user.click( openButton );

			expect( mockOnToggle ).toHaveBeenCalledWith( true );
			expect( mockOnNavigateToEntityRecord ).not.toHaveBeenCalled();
		} );

		it( 'should construct template part ID using current theme from useSelect', async () => {
			const user = userEvent.setup();

			// Mock different theme
			useSelect.mockImplementation( ( selector ) => {
				if ( typeof selector === 'function' ) {
					const mockSelect = () => ( {
						getCurrentTheme: () => ( {
							stylesheet: 'custom-theme',
						} ),
					} );
					return selector( mockSelect );
				}
				return 'custom-theme';
			} );

			render(
				<ResponsiveWrapper
					{ ...defaultProps }
					overlay="my-overlay"
					onNavigateToEntityRecord={ mockOnNavigateToEntityRecord }
				/>
			);

			const openButton = screen.getByRole( 'button', {
				name: 'Menu',
			} );

			await user.click( openButton );

			// Should use the current theme from useSelect
			expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
				postId: 'custom-theme//my-overlay',
				postType: 'wp_template_part',
			} );
		} );
	} );
} );
