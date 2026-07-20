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

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, className, onClick, ...props } ) => {
		const buttonProps = Object.fromEntries(
			Object.entries( props ).filter(
				( [ key, value ] ) =>
					key !== '__next40pxDefaultSize' && value !== false
			)
		);

		return (
			<button
				className={ className }
				onClick={ onClick }
				{ ...buttonProps }
			>
				{ children }
			</button>
		);
	},
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
	const getResponsiveContainer = () => {
		// eslint-disable-next-line testing-library/no-node-access
		return document.querySelector(
			'.wp-block-navigation__responsive-container'
		);
	};

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

	describe( 'Custom collapsed menu breakpoints', () => {
		it( 'preserves the default breakpoint behavior without inline state classes', () => {
			useMediaQuery.mockReturnValue( true );

			render(
				<ResponsiveWrapper
					{ ...defaultProps }
					collapsedMenuBreakpoint="600px"
				/>
			);

			expect( useMediaQuery ).toHaveBeenCalledWith(
				'(min-width: 600px)'
			);
			expect(
				screen.getByRole( 'button', { name: 'Menu' } )
			).not.toHaveClass( 'is-custom-collapsed-menu-breakpoint-inline' );
			expect( getResponsiveContainer() ).not.toHaveClass(
				'is-custom-collapsed-menu-breakpoint-inline'
			);
		} );

		it.each( [ '10px', '37.5em', '48rem' ] )(
			'adds inline state classes when the custom %s breakpoint matches',
			( collapsedMenuBreakpoint ) => {
				useMediaQuery.mockReturnValue( true );

				render(
					<ResponsiveWrapper
						{ ...defaultProps }
						collapsedMenuBreakpoint={ collapsedMenuBreakpoint }
						hasCustomCollapsedMenuBreakpoint
					/>
				);

				expect( useMediaQuery ).toHaveBeenCalledWith(
					`(min-width: ${ collapsedMenuBreakpoint })`
				);
				expect(
					screen.getByRole( 'button', { name: 'Menu' } )
				).toHaveClass( 'is-custom-collapsed-menu-breakpoint-inline' );
				expect( getResponsiveContainer() ).toHaveClass(
					'is-custom-collapsed-menu-breakpoint-inline'
				);
			}
		);

		it( 'keeps collapsed state classes when the custom breakpoint does not match', () => {
			useMediaQuery.mockReturnValue( false );

			render(
				<ResponsiveWrapper
					{ ...defaultProps }
					collapsedMenuBreakpoint="48rem"
					hasCustomCollapsedMenuBreakpoint
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'Menu' } )
			).not.toHaveClass( 'is-custom-collapsed-menu-breakpoint-inline' );
			expect( getResponsiveContainer() ).not.toHaveClass(
				'is-custom-collapsed-menu-breakpoint-inline'
			);
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
