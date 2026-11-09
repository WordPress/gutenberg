import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SingleNavigationMenu from '../single-navigation-menu';

const navigate = vi.fn();

vi.mock( import( '../../../lock-unlock' ), () => ( {
	unlock: () => ( { useHistory: () => ( { navigate } ) } ),
} ) );

vi.mock( import( '../../sidebar-navigation-screen-navigation-menus' ), () => ( {
	SidebarNavigationScreenWrapper: ( { children, footer } ) => (
		<div>
			{ children }
			{ footer && <footer>{ footer }</footer> }
		</div>
	),
} ) );

vi.mock( import( '../../sidebar-navigation-screen-details-footer' ), () => ( {
	default: ( { revisionsCount, onClick } ) => (
		<button onClick={ onClick }>{ `${ revisionsCount } Revisions` }</button>
	),
} ) );

vi.mock( import( '../more-menu' ), () => ( { default: () => null } ) );
vi.mock( import( '../navigation-menu-editor' ), () => ( {
	default: () => null,
} ) );

function createMenu( { count, lastRevisionId } ) {
	return {
		id: 7,
		status: 'publish',
		title: { rendered: 'Header' },
		_links: {
			'version-history': [ { count } ],
			...( lastRevisionId && {
				'predecessor-version': [ { id: lastRevisionId } ],
			} ),
		},
	};
}

describe( 'SingleNavigationMenu', () => {
	beforeEach( () => {
		navigate.mockClear();
	} );

	it( 'does not render a revisions footer with fewer than two revisions', () => {
		const { container } = render(
			<SingleNavigationMenu
				navigationMenu={ createMenu( { count: 1, lastRevisionId: 3 } ) }
			/>
		);

		expect( container.querySelector( 'footer' ) ).toBeNull();
	} );

	it( 'does not render a revisions footer without a last revision', () => {
		const { container } = render(
			<SingleNavigationMenu
				navigationMenu={ createMenu( { count: 4 } ) }
			/>
		);

		expect( container.querySelector( 'footer' ) ).toBeNull();
	} );

	it( 'opens the latest revision in the editor', async () => {
		render(
			<SingleNavigationMenu
				navigationMenu={ createMenu( {
					count: 4,
					lastRevisionId: 12,
				} ) }
			/>
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: '4 Revisions' } )
		);

		expect( navigate ).toHaveBeenCalledWith(
			'/wp_navigation/7?canvas=edit&revision=12'
		);
	} );
} );
