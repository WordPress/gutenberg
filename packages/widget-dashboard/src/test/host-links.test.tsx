import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef } from '@wordpress/element';
import { WidgetHostProvider } from '@wordpress/widget-primitives';
import type {
	WidgetAction,
	WidgetHostLinks,
} from '@wordpress/widget-primitives';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { WidgetActions } from '../components/widget-actions/widget-actions';
import { WidgetFooter } from '../components/widget-footer/widget-footer';

const MATCHED_HREF = 'admin.php?page=dashboard&p=/reports';
const MATCHED_PATH = '/reports';

/*
 * A fake host: the matcher recognizes one href, and the link records
 * whether the composition handed it a ref before forwarding it on.
 */
function createHost() {
	const receivedRef: boolean[] = [];

	const HostLink = forwardRef<
		HTMLAnchorElement,
		{ path: string } & Omit< ComponentPropsWithoutRef< 'a' >, 'href' >
	>( function HostLink( { path, children, ...props }, ref ) {
		receivedRef.push( ref !== null );

		return (
			<a ref={ ref } data-host-link="true" href={ path } { ...props }>
				{ children }
			</a>
		);
	} );

	const links: WidgetHostLinks = {
		match: ( href ) => ( href === MATCHED_HREF ? MATCHED_PATH : null ),
		Link: HostLink,
	};

	return { links, receivedRef };
}

function renderWithHost( ui: ReactNode, links: WidgetHostLinks ) {
	return render(
		<WidgetHostProvider value={ { links } }>{ ui }</WidgetHostProvider>
	);
}

describe( 'host links across the chrome compositions', () => {
	describe( 'WidgetFooter', () => {
		const footerActions: WidgetAction[] = [
			{
				id: 'report',
				label: 'See report',
				relevance: 'high',
				href: MATCHED_HREF,
			},
			{
				id: 'external',
				label: 'External guide',
				relevance: 'high',
				href: 'https://example.com/guide',
			},
			{
				id: 'status',
				label: 'Status',
				relevance: 'medium',
				icon: <svg />,
				href: MATCHED_HREF,
			},
			{
				id: 'export',
				label: 'Export data',
				relevance: 'medium',
				icon: <svg />,
				href: 'files/export.csv',
				download: 'export.csv',
			},
		];

		it( 'mounts the host link for a matched high action', () => {
			const { links } = createHost();
			renderWithHost( <WidgetFooter actions={ footerActions } />, links );

			const link = screen.getByRole( 'link', { name: 'See report' } );
			expect( link ).toHaveAttribute( 'data-host-link' );
			expect( link ).toHaveAttribute( 'href', MATCHED_PATH );
		} );

		it( 'keeps the plain anchor for an unmatched high action', () => {
			const { links } = createHost();
			renderWithHost( <WidgetFooter actions={ footerActions } />, links );

			const link = screen.getByRole( 'link', {
				name: 'External guide',
			} );
			expect( link ).not.toHaveAttribute( 'data-host-link' );
			expect( link ).toHaveAttribute(
				'href',
				'https://example.com/guide'
			);
		} );

		it( 'hands the tooltip ref to the host link of a matched medium action', () => {
			const { links, receivedRef } = createHost();
			renderWithHost( <WidgetFooter actions={ footerActions } />, links );

			const link = screen.getByRole( 'link', { name: 'Status' } );
			expect( link ).toHaveAttribute( 'data-host-link' );
			expect( link ).toHaveAttribute( 'href', MATCHED_PATH );
			expect( receivedRef ).toContain( true );
		} );

		it( 'keeps the plain anchor and the download for a download action', () => {
			const { links } = createHost();
			renderWithHost( <WidgetFooter actions={ footerActions } />, links );

			const link = screen.getByRole( 'link', { name: 'Export data' } );
			expect( link ).not.toHaveAttribute( 'data-host-link' );
			expect( link ).toHaveAttribute( 'download', 'export.csv' );
		} );

		/*
		 * The tooltip anchors to the element the host link forwards its ref
		 * to; a link that drops it never opens the tooltip on hover.
		 */
		it( 'shows the tooltip of a matched medium action on hover', async () => {
			const user = userEvent.setup();
			const { links } = createHost();
			renderWithHost( <WidgetFooter actions={ footerActions } />, links );

			await user.hover( screen.getByRole( 'link', { name: 'Status' } ) );

			await waitFor(
				() => {
					expect( screen.getByText( 'Status' ) ).toBeVisible();
				},
				{ timeout: 3000 }
			);
		} );
	} );

	describe( 'WidgetActions menu', () => {
		const menuActions: WidgetAction[] = [
			{ id: 'report', label: 'See report', href: MATCHED_HREF },
			{
				id: 'external',
				label: 'External guide',
				href: 'https://example.com/guide',
				openInNewTab: true,
			},
			{
				id: 'export',
				label: 'Export data',
				href: 'files/export.csv',
				download: 'export.csv',
			},
		];

		it( 'routes only the matched item through the host link', async () => {
			const user = userEvent.setup();
			const { links, receivedRef } = createHost();
			renderWithHost( <WidgetActions actions={ menuActions } />, links );

			await user.click( screen.getByRole( 'button', { name: 'More' } ) );

			const matched = await screen.findByRole( 'menuitem', {
				name: 'See report',
			} );
			expect( matched ).toHaveAttribute( 'data-host-link' );
			expect( matched ).toHaveAttribute( 'href', MATCHED_PATH );
			expect( receivedRef ).toContain( true );

			const external = screen.getByRole( 'menuitem', {
				name: /External guide/,
			} );
			expect( external ).not.toHaveAttribute( 'data-host-link' );
			expect( external ).toHaveAttribute( 'target', '_blank' );

			const download = screen.getByRole( 'menuitem', {
				name: 'Export data',
			} );
			expect( download ).not.toHaveAttribute( 'data-host-link' );
			expect( download ).toHaveAttribute( 'download', 'export.csv' );
		} );

		/*
		 * The menu reaches its items through the ref the host link forwards;
		 * a link that drops it leaves the matched item unreachable by
		 * keyboard.
		 */
		it( 'keeps the matched item reachable by keyboard', async () => {
			const user = userEvent.setup();
			const { links } = createHost();
			renderWithHost( <WidgetActions actions={ menuActions } />, links );

			await user.tab();
			expect(
				screen.getByRole( 'button', { name: 'More' } )
			).toHaveFocus();

			await user.keyboard( '{ArrowDown}' );
			const matched = await screen.findByRole( 'menuitem', {
				name: 'See report',
			} );
			await waitFor( () => expect( matched ).toHaveFocus() );

			await user.keyboard( '{ArrowDown}' );
			await waitFor( () =>
				expect(
					screen.getByRole( 'menuitem', { name: /External guide/ } )
				).toHaveFocus()
			);

			await user.keyboard( '{ArrowUp}' );
			await waitFor( () => expect( matched ).toHaveFocus() );
		} );
	} );
} );
