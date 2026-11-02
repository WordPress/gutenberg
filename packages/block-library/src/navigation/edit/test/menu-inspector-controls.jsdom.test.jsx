import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuInspectorControls from '../menu-inspector-controls';
import useNavigationMenu from '../../use-navigation-menu';

vi.mock( import( '../../use-navigation-menu' ), () => ( {
	default: vi.fn(),
} ) );

vi.mock( import( '../../../lock-unlock' ), async () => {
	const { createContext } = await import( '@wordpress/element' );
	const PrivateBlockContext = createContext( {
		isSelectionWithinCurrentSection: false,
	} );

	return {
		unlock: ( target ) => ( {
			PrivateListView: () => <div data-testid="private-list-view" />,
			PrivateBlockContext,
			useListViewPanelState: () => ( {
				isOpened: true,
				expandRevision: 0,
				handleToggle: vi.fn(),
			} ),
			useBlockDisplayTitle: () => 'Navigation',
			openListViewContentPanel: vi.fn(),
			...target,
		} ),
	};
} );

vi.mock( import( '../navigation-menu-selector' ), () => ( {
	default: () => <div data-testid="navigation-menu-selector" />,
} ) );

vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		...actual,
		InspectorControls: ( { children } ) => (
			<div data-testid="inspector-controls">{ children }</div>
		),
	};
} );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		...actual,
		useSelect: () => true,
		useDispatch: () => ( {
			openListViewContentPanel: vi.fn(),
		} ),
	};
} );

describe( 'MenuInspectorControls', () => {
	const defaultProps = {
		clientId: 'block-client-id-1',
		currentMenuId: 123,
	};

	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'renders draft badge and infotip when navigation menu status is draft', async () => {
		const user = userEvent.setup();

		useNavigationMenu.mockReturnValue( {
			navigationMenu: {
				id: 123,
				status: 'draft',
			},
		} );

		render( <MenuInspectorControls { ...defaultProps } /> );

		const inspector = screen.getByTestId( 'inspector-controls' );
		const draftBadge = within( inspector ).getByRole( 'button', {
			name: 'Draft',
		} );
		expect( draftBadge ).toBeVisible();

		await user.click( draftBadge );

		expect(
			await screen.findByRole( 'dialog', { name: 'Draft status' } )
		).toHaveTextContent(
			"This menu is a draft. It will not be visible on your site until it's published."
		);
	} );

	it( 'does not render draft badge when navigation menu status is publish', () => {
		useNavigationMenu.mockReturnValue( {
			navigationMenu: {
				id: 123,
				status: 'publish',
			},
		} );

		render( <MenuInspectorControls { ...defaultProps } /> );

		const inspector = screen.getByTestId( 'inspector-controls' );
		expect(
			within( inspector ).queryByRole( 'button', { name: 'Draft' } )
		).not.toBeInTheDocument();
		expect(
			within( inspector ).queryByText( 'Draft' )
		).not.toBeInTheDocument();
	} );

	it( 'does not render draft badge when navigation menu is not defined', () => {
		useNavigationMenu.mockReturnValue( {
			navigationMenu: undefined,
		} );

		render( <MenuInspectorControls { ...defaultProps } /> );

		const inspector = screen.getByTestId( 'inspector-controls' );
		expect(
			within( inspector ).queryByRole( 'button', { name: 'Draft' } )
		).not.toBeInTheDocument();
		expect(
			within( inspector ).queryByText( 'Draft' )
		).not.toBeInTheDocument();
	} );
} );
