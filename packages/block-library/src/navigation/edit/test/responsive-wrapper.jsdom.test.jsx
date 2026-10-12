import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import ResponsiveWrapper from '../responsive-wrapper';

// Mock block-editor to avoid private API issues
vi.mock( import( '@wordpress/block-editor' ), () => ( {
	getColorClassName: vi.fn( () => '' ),
} ) );

// Mock core-data store
vi.mock( import( '@wordpress/core-data' ), () => ( {
	store: {},
} ) );

// Mock useSelect
vi.mock( import( '@wordpress/data' ), () => ( {
	useSelect: vi.fn(),
	createSelector: vi.fn( ( fn ) => fn ),
	createRegistrySelector: vi.fn( ( fn ) => fn ),
	createReduxStore: vi.fn( () => ( {} ) ),
	combineReducers: vi.fn( ( reducers ) => ( state = {}, action ) => {
		const newState = {};
		Object.keys( reducers ).forEach( ( key ) => {
			newState[ key ] = reducers[ key ]( state[ key ], action );
		} );
		return newState;
	} ),
	register: vi.fn(),
} ) );

describe( 'ResponsiveWrapper', () => {
	const mockOnToggle = vi.fn();
	const mockOnNavigateToEntityRecord = vi.fn();

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
		vi.clearAllMocks();
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
} );
