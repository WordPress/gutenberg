import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect, useDispatch } from '@wordpress/data';
import ResponsiveWrapper from '../responsive-wrapper';

// Mock block-editor to avoid private API issues
jest.mock( '@wordpress/block-editor', () => ( {
	getColorClassName: jest.fn( () => '' ),
	store: {},
} ) );

// Mock core-data store
jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

// Mock patterns store
jest.mock( '@wordpress/patterns', () => ( {
	store: {},
} ) );

// Mock lock-unlock: the customization of a registered overlay.
const mockCustomizePattern = jest.fn();
jest.mock( '../../../lock-unlock', () => ( {
	unlock: () => ( {
		customizePattern: mockCustomizePattern,
	} ),
} ) );

// Mock the overlays: a registered one and a user pattern.
const mockUseOverlayPatterns = jest.fn();
jest.mock( '../use-overlay-patterns', () => ( {
	__esModule: true,
	default: () => mockUseOverlayPatterns(),
} ) );

// Mock useSelect and useDispatch
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
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
		useDispatch.mockReturnValue( {} );
		mockUseOverlayPatterns.mockReturnValue( {
			overlays: [
				{
					slug: 'my-overlay',
					name: 'twentytwentyfive/part/my-overlay',
					pattern: { name: 'twentytwentyfive/part/my-overlay' },
					title: { rendered: 'My Overlay' },
				},
				{
					slug: 'custom-overlay',
					id: 77,
					isUser: true,
					title: { rendered: 'Custom Overlay' },
				},
			],
			isResolving: false,
			hasResolved: true,
		} );
		mockCustomizePattern.mockResolvedValue( { id: 123 } );
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
		it( 'should open the overlay pattern copy when a custom overlay slug is provided', async () => {
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

			// Should open the registered overlay's customization.
			await waitFor( () =>
				expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
					postId: 123,
					postType: 'wp_block',
				} )
			);
			expect( mockCustomizePattern ).toHaveBeenCalledWith(
				expect.objectContaining( {
					name: 'twentytwentyfive/part/my-overlay',
				} )
			);
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

		it( 'should open a user pattern overlay directly', async () => {
			const user = userEvent.setup();

			render(
				<ResponsiveWrapper
					{ ...defaultProps }
					overlay="custom-overlay"
					onNavigateToEntityRecord={ mockOnNavigateToEntityRecord }
				/>
			);

			const openButton = screen.getByRole( 'button', {
				name: 'Menu',
			} );

			await user.click( openButton );

			await waitFor( () =>
				expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
					postId: 77,
					postType: 'wp_block',
				} )
			);
			expect( mockCustomizePattern ).not.toHaveBeenCalled();
		} );
	} );
} );
