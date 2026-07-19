import { DirectionProvider } from '@base-ui/react/direction-provider';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, forwardRef, useState } from '@wordpress/element';
import * as Menu from '../../menu';
import * as NavigationMenu from '../index';

function expectWarning( message: string ) {
	// The project-specific console matcher is registered at test runtime.
	// eslint-disable-next-line jest/valid-expect
	const matchers = expect( console ) as unknown as {
		toHaveWarnedWith: ( expectedMessage: string ) => void;
	};
	matchers.toHaveWarnedWith( message );
}

function DefaultPopup() {
	return (
		<NavigationMenu.Popup>
			<NavigationMenu.Viewport />
		</NavigationMenu.Popup>
	);
}

function FlyoutNavigation( {
	closeOnClick = false,
}: {
	closeOnClick?: boolean;
} ) {
	return (
		<NavigationMenu.Root aria-label="Content">
			<NavigationMenu.List>
				<NavigationMenu.Item value="appearance">
					<NavigationMenu.Trigger>Appearance</NavigationMenu.Trigger>
					<NavigationMenu.Content>
						<NavigationMenu.Root orientation="vertical">
							<NavigationMenu.List>
								<NavigationMenu.Item>
									<NavigationMenu.Link
										href="/themes"
										closeOnClick={ closeOnClick }
										onClick={ ( event ) =>
											event.preventDefault()
										}
									>
										Themes
									</NavigationMenu.Link>
								</NavigationMenu.Item>
							</NavigationMenu.List>
						</NavigationMenu.Root>
					</NavigationMenu.Content>
				</NavigationMenu.Item>
			</NavigationMenu.List>
			<DefaultPopup />
		</NavigationMenu.Root>
	);
}

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

	it( 'uses the shared item layout for rich link content', () => {
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
								description: 'Command P',
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
		expect( Menu.ItemLabel ).toBe( NavigationMenu.ItemLabel );
		expect( Menu.ItemDescription ).toBe( NavigationMenu.ItemDescription );
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
		>( function RouterLink( { children, ...props }, ref ) {
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

	it( 'opens a flyout with disclosure-navigation semantics', async () => {
		const user = userEvent.setup();
		render( <FlyoutNavigation /> );

		const trigger = screen.getByRole( 'button', { name: 'Appearance' } );
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );

		await user.click( trigger );

		expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
		expect(
			await screen.findByRole( 'link', { name: 'Themes' } )
		).toHaveAttribute( 'href', '/themes' );
		expect( screen.getAllByRole( 'navigation' ) ).toHaveLength( 1 );
		expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps links and triggers in the normal tab sequence', async () => {
		const user = userEvent.setup();
		render(
			<NavigationMenu.Root aria-label="Content">
				<NavigationMenu.List>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/posts">
							Posts
						</NavigationMenu.Link>
					</NavigationMenu.Item>
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
				<DefaultPopup />
			</NavigationMenu.Root>
		);

		await user.tab();
		expect( screen.getByRole( 'link', { name: 'Posts' } ) ).toHaveFocus();
		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'Appearance' } )
		).toHaveFocus();
	} );

	it( 'closes on Escape and restores focus to the trigger', async () => {
		const user = userEvent.setup();
		render( <FlyoutNavigation /> );

		const trigger = screen.getByRole( 'button', { name: 'Appearance' } );
		await user.click( trigger );
		await screen.findByRole( 'link', { name: 'Themes' } );
		await user.keyboard( '{Escape}' );

		await waitFor( () => {
			expect(
				screen.queryByRole( 'link', { name: 'Themes' } )
			).not.toBeInTheDocument();
		} );
		expect( trigger ).toHaveFocus();
	} );

	it( 'closes the navigation tree when a link opts into closeOnClick', async () => {
		const user = userEvent.setup();
		render( <FlyoutNavigation closeOnClick /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Appearance' } )
		);
		await user.click(
			await screen.findByRole( 'link', { name: 'Themes' } )
		);

		await waitFor( () => {
			expect(
				screen.queryByRole( 'link', { name: 'Themes' } )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'supports controlled open values', async () => {
		const user = userEvent.setup();

		function ControlledNavigationMenu() {
			const [ value, setValue ] = useState< string | null >( null );
			return (
				<NavigationMenu.Root
					aria-label="Content"
					value={ value }
					onValueChange={ setValue }
				>
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
					<DefaultPopup />
				</NavigationMenu.Root>
			);
		}

		render( <ControlledNavigationMenu /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Appearance' } )
		);
		expect(
			await screen.findByRole( 'link', { name: 'Themes' } )
		).toBeVisible();
	} );

	it( 'keeps current-page state independent from the open flyout', async () => {
		const user = userEvent.setup();
		render(
			<NavigationMenu.Root aria-label="Content">
				<NavigationMenu.List>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/posts" active>
							Posts
						</NavigationMenu.Link>
					</NavigationMenu.Item>
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
				<DefaultPopup />
			</NavigationMenu.Root>
		);

		const trigger = screen.getByRole( 'button', { name: 'Appearance' } );
		await user.click( trigger );

		expect( trigger ).not.toHaveAttribute( 'aria-current' );
		expect( screen.getByRole( 'link', { name: 'Posts' } ) ).toHaveAttribute(
			'aria-current',
			'page'
		);
	} );

	it( 'supplements Tab navigation with directional keys', async () => {
		const user = userEvent.setup();
		render(
			<NavigationMenu.Root aria-label="Content">
				<NavigationMenu.List>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/posts">
							Posts
						</NavigationMenu.Link>
					</NavigationMenu.Item>
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
				<DefaultPopup />
			</NavigationMenu.Root>
		);

		await user.tab();
		expect( screen.getByRole( 'link', { name: 'Posts' } ) ).toHaveFocus();
		await user.keyboard( '{ArrowRight}' );
		expect(
			screen.getByRole( 'button', { name: 'Appearance' } )
		).toHaveFocus();

		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'Appearance' } )
		).not.toHaveFocus();
	} );

	it.each( [
		[ 'ltr', '{ArrowRight}' ],
		[ 'rtl', '{ArrowLeft}' ],
	] as const )(
		'opens a nested flyout with the inline-end arrow in %s',
		async ( direction, openKey ) => {
			const user = userEvent.setup();
			render(
				<DirectionProvider direction={ direction }>
					<NavigationMenu.Root aria-label="Content">
						<NavigationMenu.List>
							<NavigationMenu.Item value="appearance">
								<NavigationMenu.Trigger>
									Appearance
								</NavigationMenu.Trigger>
								<NavigationMenu.Content>
									<NavigationMenu.Root orientation="vertical">
										<NavigationMenu.List>
											<NavigationMenu.Item value="design">
												<NavigationMenu.Trigger>
													Design
												</NavigationMenu.Trigger>
												<NavigationMenu.Content>
													<NavigationMenu.Link href="/styles">
														Styles
													</NavigationMenu.Link>
												</NavigationMenu.Content>
											</NavigationMenu.Item>
										</NavigationMenu.List>
										<DefaultPopup />
									</NavigationMenu.Root>
								</NavigationMenu.Content>
							</NavigationMenu.Item>
						</NavigationMenu.List>
						<DefaultPopup />
					</NavigationMenu.Root>
				</DirectionProvider>
			);

			const outerTrigger = screen.getByRole( 'button', {
				name: 'Appearance',
			} );
			outerTrigger.focus();
			await user.keyboard( '{ArrowDown}' );

			const nestedTrigger = await screen.findByRole( 'button', {
				name: 'Design',
			} );
			expect( nestedTrigger ).toHaveFocus();
			await user.keyboard( openKey );

			expect( nestedTrigger ).toHaveAttribute( 'aria-expanded', 'true' );
			expect(
				await screen.findByRole( 'link', { name: 'Styles' } )
			).toHaveFocus();
		}
	);

	it( 'closes on focus-out without restoring focus to the trigger', async () => {
		const user = userEvent.setup();
		render(
			<>
				<FlyoutNavigation />
				<button>Outside</button>
			</>
		);

		const trigger = screen.getByRole( 'button', { name: 'Appearance' } );
		const outside = screen.getByRole( 'button', { name: 'Outside' } );
		await user.click( trigger );
		await screen.findByRole( 'link', { name: 'Themes' } );
		act( () => outside.focus() );

		await waitFor( () => {
			expect(
				screen.queryByRole( 'link', { name: 'Themes' } )
			).not.toBeInTheDocument();
		} );
		expect( outside ).toHaveFocus();
	} );

	it( 'opens and closes flyouts through hover and click', async () => {
		const user = userEvent.setup();
		render(
			<NavigationMenu.Root
				aria-label="Content"
				delay={ 0 }
				closeDelay={ 0 }
			>
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
				<DefaultPopup />
			</NavigationMenu.Root>
		);

		const trigger = screen.getByRole( 'button', { name: 'Appearance' } );
		await user.hover( trigger );
		expect(
			await screen.findByRole( 'link', { name: 'Themes' } )
		).toBeVisible();
		await user.unhover( trigger );
		await waitFor( () => {
			expect(
				screen.queryByRole( 'link', { name: 'Themes' } )
			).not.toBeInTheDocument();
		} );

		const clickUser = userEvent.setup( { skipHover: true } );
		await clickUser.click( trigger );
		expect(
			await screen.findByRole( 'link', { name: 'Themes' } )
		).toBeVisible();
		await clickUser.click( trigger );
		await waitFor( () => {
			expect(
				screen.queryByRole( 'link', { name: 'Themes' } )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'switches Viewport content between top-level triggers', async () => {
		const user = userEvent.setup( { skipHover: true } );
		render(
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
					<NavigationMenu.Item value="settings">
						<NavigationMenu.Trigger>
							Settings
						</NavigationMenu.Trigger>
						<NavigationMenu.Content>
							<NavigationMenu.Link href="/general">
								General
							</NavigationMenu.Link>
						</NavigationMenu.Content>
					</NavigationMenu.Item>
				</NavigationMenu.List>
				<DefaultPopup />
			</NavigationMenu.Root>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Appearance' } )
		);
		expect(
			await screen.findByRole( 'link', { name: 'Themes' } )
		).toBeVisible();
		await user.click( screen.getByRole( 'button', { name: 'Settings' } ) );

		expect(
			await screen.findByRole( 'link', { name: 'General' } )
		).toBeVisible();
		await waitFor( () => {
			expect(
				screen.queryByRole( 'link', { name: 'Themes' } )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'keeps inactive keepMounted content unavailable', async () => {
		render(
			<NavigationMenu.Root aria-label="Content">
				<NavigationMenu.List>
					<NavigationMenu.Item value="appearance">
						<NavigationMenu.Trigger>
							Appearance
						</NavigationMenu.Trigger>
						<NavigationMenu.Content
							keepMounted
							data-testid="kept-content"
						>
							<NavigationMenu.Link href="/themes">
								Themes
							</NavigationMenu.Link>
						</NavigationMenu.Content>
					</NavigationMenu.Item>
				</NavigationMenu.List>
				<DefaultPopup />
			</NavigationMenu.Root>
		);

		expect( screen.getByTestId( 'kept-content' ) ).toHaveAttribute(
			'hidden'
		);
		expect(
			screen.queryByRole( 'link', { name: 'Themes' } )
		).not.toBeInTheDocument();
	} );

	it( 'warns about invalid authoring relationships in development', async () => {
		expect.hasAssertions();
		render(
			<NavigationMenu.Root>
				<NavigationMenu.List>
					<NavigationMenu.Item value="duplicate">
						<NavigationMenu.Link href="/one" active>
							<NavigationMenu.ItemDescription>
								Description only
							</NavigationMenu.ItemDescription>
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
			expectWarning(
				'NavigationMenu: Trigger requires corresponding Content in the same Item.'
			);
		} );
		expectWarning(
			'NavigationMenu: Outer Root requires an accessible name through aria-label or aria-labelledby.'
		);
		expectWarning(
			'NavigationMenu: Only one Link in the same Root should be active.'
		);
		expectWarning(
			'NavigationMenu: Item values must be unique within the same Root.'
		);
		expectWarning(
			'ItemLayout: ItemDescription requires ItemLabel or an explicit accessible name.'
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

	it( 'uses logical inline positioning for nested flyouts in RTL', async () => {
		const user = userEvent.setup();

		render(
			<DirectionProvider direction="rtl">
				<NavigationMenu.Root aria-label="Content">
					<NavigationMenu.List>
						<NavigationMenu.Item value="appearance">
							<NavigationMenu.Trigger>
								Appearance
							</NavigationMenu.Trigger>
							<NavigationMenu.Content>
								<NavigationMenu.Root orientation="vertical">
									<NavigationMenu.List>
										<NavigationMenu.Item value="design">
											<NavigationMenu.Trigger>
												Design
											</NavigationMenu.Trigger>
											<NavigationMenu.Content>
												<NavigationMenu.Link href="/styles">
													Styles
												</NavigationMenu.Link>
											</NavigationMenu.Content>
										</NavigationMenu.Item>
									</NavigationMenu.List>
									<NavigationMenu.Popup
										positioner={
											<NavigationMenu.Positioner data-testid="nested-positioner" />
										}
									>
										<NavigationMenu.Viewport />
									</NavigationMenu.Popup>
								</NavigationMenu.Root>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
					</NavigationMenu.List>
					<DefaultPopup />
				</NavigationMenu.Root>
			</DirectionProvider>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Appearance' } )
		);
		await user.click(
			await screen.findByRole( 'button', { name: 'Design' } )
		);

		expect(
			await screen.findByRole( 'link', { name: 'Styles' } )
		).toBeVisible();
		expect( screen.getByTestId( 'nested-positioner' ) ).toHaveAttribute(
			'data-side',
			'inline-end'
		);
	} );

	it( 'forwards refs from every rendered part', async () => {
		const user = userEvent.setup();
		const rootRef = createRef< HTMLElement >();
		const listRef = createRef< HTMLUListElement >();
		const itemRef = createRef< HTMLLIElement >();
		const triggerRef = createRef< HTMLButtonElement >();
		const contentRef = createRef< HTMLDivElement >();
		const popupRef = createRef< HTMLElement >();
		const viewportRef = createRef< HTMLDivElement >();

		render(
			<NavigationMenu.Root ref={ rootRef } aria-label="Content">
				<NavigationMenu.List ref={ listRef }>
					<NavigationMenu.Item ref={ itemRef } value="appearance">
						<NavigationMenu.Trigger ref={ triggerRef }>
							Appearance
						</NavigationMenu.Trigger>
						<NavigationMenu.Content ref={ contentRef }>
							<NavigationMenu.Link href="/themes">
								Themes
							</NavigationMenu.Link>
						</NavigationMenu.Content>
					</NavigationMenu.Item>
				</NavigationMenu.List>
				<NavigationMenu.Popup ref={ popupRef }>
					<NavigationMenu.Viewport ref={ viewportRef } />
				</NavigationMenu.Popup>
			</NavigationMenu.Root>
		);

		expect( rootRef.current ).toBeInstanceOf( HTMLElement );
		expect( listRef.current ).toBeInstanceOf( HTMLUListElement );
		expect( itemRef.current ).toBeInstanceOf( HTMLLIElement );
		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );

		await user.click(
			screen.getByRole( 'button', { name: 'Appearance' } )
		);
		await waitFor( () => {
			expect( contentRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( viewportRef.current ).toBeInstanceOf( HTMLDivElement );
		} );
	} );
} );
