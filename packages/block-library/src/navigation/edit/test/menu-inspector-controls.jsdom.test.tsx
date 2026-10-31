import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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
		unlock: ( target: any ) => ( {
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

vi.mock( import( '../navigation-list-view-header' ), () => ( {
	default: () => <div data-testid="navigation-list-view-header" />,
} ) );

vi.mock( import( '../navigation-menu-selector' ), () => ( {
	default: () => <div data-testid="navigation-menu-selector" />,
} ) );

vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => {
	const actual =
		await importOriginal< typeof import( '@wordpress/block-editor' ) >();
	return {
		...actual,
		InspectorControls: ( { children }: { children: React.ReactNode } ) => (
			<div data-testid="inspector-controls">{ children }</div>
		),
	};
} );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	const actual = await importOriginal< typeof import( '@wordpress/data' ) >();
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

	it( 'renders draft warning notice when navigation menu status is draft', () => {
		(
			useNavigationMenu as unknown as ReturnType< typeof vi.fn >
		 ).mockReturnValue( {
			navigationMenu: {
				id: 123,
				status: 'draft',
			},
		} );

		render( <MenuInspectorControls { ...defaultProps } /> );

		const inspector = screen.getByTestId( 'inspector-controls' );
		expect(
			within( inspector ).getByText(
				"This menu is a draft. It will not be visible on your site until it's published."
			)
		).toBeInTheDocument();
	} );

	it( 'does not render draft warning notice when navigation menu status is publish', () => {
		(
			useNavigationMenu as unknown as ReturnType< typeof vi.fn >
		 ).mockReturnValue( {
			navigationMenu: {
				id: 123,
				status: 'publish',
			},
		} );

		render( <MenuInspectorControls { ...defaultProps } /> );

		const inspector = screen.getByTestId( 'inspector-controls' );
		expect(
			within( inspector ).queryByText(
				"This menu is a draft. It will not be visible on your site until it's published."
			)
		).not.toBeInTheDocument();
	} );

	it( 'does not render draft warning notice when navigation menu is not defined', () => {
		(
			useNavigationMenu as unknown as ReturnType< typeof vi.fn >
		 ).mockReturnValue( {
			navigationMenu: undefined,
		} );

		render( <MenuInspectorControls { ...defaultProps } /> );

		const inspector = screen.getByTestId( 'inspector-controls' );
		expect(
			within( inspector ).queryByText(
				"This menu is a draft. It will not be visible on your site until it's published."
			)
		).not.toBeInTheDocument();
	} );
} );
