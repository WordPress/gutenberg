import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, forwardRef } from '@wordpress/element';
import * as NavigationMenu from '../index';

describe( 'NavigationMenu', () => {
	it( 'renders native navigation and current-page semantics', () => {
		render(
			<NavigationMenu.Root aria-label="Content">
				<NavigationMenu.List>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/posts" active>
							Posts
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/pages">
							Pages
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				</NavigationMenu.List>
			</NavigationMenu.Root>
		);

		const navigation = screen.getByRole( 'navigation', {
			name: 'Content',
		} );
		const currentLink = screen.getByRole( 'link', { name: 'Posts' } );

		expect( navigation.tagName ).toBe( 'NAV' );
		expect( screen.getByRole( 'list' ).tagName ).toBe( 'UL' );
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 2 );
		expect( currentLink ).toHaveAttribute( 'href', '/posts' );
		expect( currentLink ).toHaveAttribute( 'aria-current', 'page' );
		expect( currentLink ).toHaveAttribute( 'data-active' );
		expect(
			screen.getByRole( 'link', { name: 'Pages' } )
		).not.toHaveAttribute( 'aria-current' );
		expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'menuitem' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'tablist' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();
	} );

	it( 'connects rich link content to its accessible name and description', () => {
		render(
			<NavigationMenu.Root aria-label="Content">
				<NavigationMenu.List>
					<NavigationMenu.Item>
						<NavigationMenu.Link
							href="/patterns"
							prefix="Prefix"
							suffix="Suffix"
							shortcut={ {
								displayShortcut: '⌘P',
								ariaKeyShortcut: 'Meta+P',
								label: 'Command P',
							} }
						>
							<NavigationMenu.ItemLabel>
								Patterns
							</NavigationMenu.ItemLabel>
							<NavigationMenu.ItemDescription>
								Manage reusable patterns.
							</NavigationMenu.ItemDescription>
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				</NavigationMenu.List>
			</NavigationMenu.Root>
		);

		const link = screen.getByRole( 'link', {
			name: 'Patterns',
			description:
				'Manage reusable patterns. Keyboard shortcut: Command P',
		} );
		const shortcut = screen.getByText( '⌘P' );

		expect( link ).toHaveAttribute( 'aria-keyshortcuts', 'Meta+P' );
		expect( shortcut ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( screen.getByText( 'Prefix' ) ).toBeVisible();
		expect( screen.getByText( 'Suffix' ) ).toBeVisible();
	} );

	it( 'supports links that open in a new tab', () => {
		render(
			<NavigationMenu.Root aria-label="Content">
				<NavigationMenu.List>
					<NavigationMenu.Item>
						<NavigationMenu.Link
							href="https://wordpress.org"
							openInNewTab
							rel="nofollow"
						>
							WordPress.org
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				</NavigationMenu.List>
			</NavigationMenu.Root>
		);

		const link = screen.getByRole( 'link', {
			name: 'WordPress.org (opens in a new tab)',
		} );

		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'nofollow' );
	} );

	it( 'passes native and accessible props through router composition', () => {
		const routerRef = createRef< HTMLAnchorElement >();
		const RouterLink = forwardRef<
			HTMLAnchorElement,
			React.ComponentProps< 'a' >
		>( function UnforwardedRouterLink( { children, ...props }, ref ) {
			return (
				<a ref={ ref } data-router-link="true" { ...props }>
					{ children }
				</a>
			);
		} );

		render(
			<NavigationMenu.Root aria-label="Content">
				<NavigationMenu.List>
					<NavigationMenu.Item>
						<NavigationMenu.Link
							ref={ routerRef }
							href="/posts"
							active
							render={ <RouterLink /> }
						>
							Posts
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				</NavigationMenu.List>
			</NavigationMenu.Root>
		);

		const link = screen.getByRole( 'link', { name: 'Posts' } );

		expect( link ).toHaveAttribute( 'data-router-link', 'true' );
		expect( link ).toHaveAttribute( 'href', '/posts' );
		expect( link ).toHaveAttribute( 'aria-current', 'page' );
		expect( routerRef.current ).toBe( link );
	} );

	it( 'warns about invalid authoring relationships in development', async () => {
		expect.hasAssertions();
		render(
			<NavigationMenu.Root>
				<NavigationMenu.List>
					<NavigationMenu.Item value="duplicate">
						<NavigationMenu.Link href="/one" active>
							One
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item value="duplicate">
						<NavigationMenu.Link href="/two" active>
							Two
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item value="unpaired">
						<NavigationMenu.Trigger>
							Unpaired
						</NavigationMenu.Trigger>
					</NavigationMenu.Item>
				</NavigationMenu.List>
			</NavigationMenu.Root>
		);

		await waitFor( () => {
			expect( console ).toHaveWarnedWith(
				'NavigationMenu: Trigger requires corresponding Content in the same Item.'
			);
		} );
		expect( console ).toHaveWarnedWith(
			'NavigationMenu: Outer Root requires an accessible name through aria-label or aria-labelledby.'
		);
		expect( console ).toHaveWarnedWith(
			'NavigationMenu: Only one Link in the same Root should be active.'
		);
		expect( console ).toHaveWarnedWith(
			'NavigationMenu: Item values must be unique within the same Root.'
		);
	} );

	it( 'requires href and owns aria-current at the type level', () => {
		// @ts-expect-error Navigation destinations require a real href.
		const missingHref = <NavigationMenu.Link>Posts</NavigationMenu.Link>;
		const explicitCurrentProps = {
			href: '/posts',
			// @ts-expect-error Current-page state is controlled with active.
			'aria-current': 'step',
		} satisfies React.ComponentProps< typeof NavigationMenu.Link >;

		expect( missingHref ).toBeDefined();
		expect( explicitCurrentProps ).toBeDefined();
	} );

	it( 'supports custom portal, positioner, backdrop, and arrow slots', async () => {
		const user = userEvent.setup();
		const containerRef = createRef< HTMLDivElement >();

		render(
			<div>
				<div ref={ containerRef } data-testid="portal-container" />
				<NavigationMenu.Root aria-label="Content">
					<NavigationMenu.List>
						<NavigationMenu.Item value="appearance">
							<NavigationMenu.Trigger>
								Appearance
							</NavigationMenu.Trigger>
							<NavigationMenu.Content>
								<NavigationMenu.Link href="/themes">
									Themes
								</NavigationMenu.Link>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
					</NavigationMenu.List>
					<NavigationMenu.Popup
						portal={
							<NavigationMenu.Portal container={ containerRef } />
						}
						positioner={
							<NavigationMenu.Positioner data-testid="positioner" />
						}
						backdrop={
							<NavigationMenu.Backdrop data-testid="backdrop" />
						}
					>
						<NavigationMenu.Arrow data-testid="arrow" />
						<NavigationMenu.Viewport />
					</NavigationMenu.Popup>
				</NavigationMenu.Root>
			</div>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Appearance' } )
		);
		await screen.findByRole( 'link', { name: 'Themes' } );

		const portalContainer = screen.getByTestId( 'portal-container' );
		expect( portalContainer ).toContainElement(
			screen.getByTestId( 'positioner' )
		);
		expect( portalContainer ).toContainElement(
			screen.getByTestId( 'backdrop' )
		);
		expect( screen.getByTestId( 'arrow' ) ).toBeVisible();
	} );
} );
