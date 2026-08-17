import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import ResponsiveWrapper from '../responsive-wrapper';

// jsdom has no layout, so the viewport match is stubbed.
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useViewportMatch: jest.fn(),
} ) );

// Mock block-editor to avoid private API issues
jest.mock( '@wordpress/block-editor', () => ( {
	getColorClassName: jest.fn( () => '' ),
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

	describe( 'Closing the overlay on viewport changes', () => {
		// Stands in for a resize of the editor canvas.
		function resizeTo( { isAboveBreakpoint }, rerender, props = {} ) {
			useViewportMatch.mockReturnValue( isAboveBreakpoint );
			rerender(
				<ResponsiveWrapper { ...defaultProps } isOpen { ...props } />
			);
		}

		it( 'should close an open overlay when the viewport widens past the breakpoint', () => {
			useViewportMatch.mockReturnValue( false );

			const { rerender } = render(
				<ResponsiveWrapper { ...defaultProps } isOpen />
			);

			expect( mockOnToggle ).not.toHaveBeenCalled();

			resizeTo( { isAboveBreakpoint: true }, rerender );

			expect( mockOnToggle ).toHaveBeenCalledWith( false );
		} );

		it( 'should close an open overlay that is already rendered above the breakpoint', () => {
			useViewportMatch.mockReturnValue( true );

			render( <ResponsiveWrapper { ...defaultProps } isOpen /> );

			expect( mockOnToggle ).toHaveBeenCalledWith( false );
		} );

		it( 'should keep an open overlay below the breakpoint', () => {
			useViewportMatch.mockReturnValue( false );

			render( <ResponsiveWrapper { ...defaultProps } isOpen /> );

			expect( mockOnToggle ).not.toHaveBeenCalled();
		} );

		it( 'should not close an overlay that is set to show at every viewport size', () => {
			useViewportMatch.mockReturnValue( false );

			const { rerender } = render(
				<ResponsiveWrapper
					{ ...defaultProps }
					isOpen
					isHiddenByDefault
				/>
			);

			resizeTo( { isAboveBreakpoint: true }, rerender, {
				isHiddenByDefault: true,
			} );

			expect( mockOnToggle ).not.toHaveBeenCalled();
		} );

		it( 'should not toggle a closed overlay when the viewport changes', () => {
			useViewportMatch.mockReturnValue( false );

			const { rerender } = render(
				<ResponsiveWrapper { ...defaultProps } />
			);

			useViewportMatch.mockReturnValue( true );
			rerender( <ResponsiveWrapper { ...defaultProps } /> );

			expect( mockOnToggle ).not.toHaveBeenCalled();
		} );

		it( 'should match the breakpoint against the window the navigation renders in', () => {
			useViewportMatch.mockReturnValue( false );

			render( <ResponsiveWrapper { ...defaultProps } isOpen /> );

			// The canvas window is passed through, not the admin window.
			expect( useViewportMatch ).toHaveBeenLastCalledWith(
				'small',
				'>=',
				window
			);
		} );
	} );
} );
