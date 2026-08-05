import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef, forwardRef } from '@wordpress/element';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { WidgetHostProvider } from '../widget-host';
import type { WidgetHostLinks } from '../widget-host';
import { HostLink } from '../host-link';

const MATCHED_HREF = 'admin.php?page=dashboard&p=/reports';
const MATCHED_PATH = '/reports';

const links: WidgetHostLinks = {
	match: ( href ) => ( href === MATCHED_HREF ? MATCHED_PATH : null ),
	Link: forwardRef<
		HTMLAnchorElement,
		{ path: string } & Omit< ComponentPropsWithoutRef< 'a' >, 'href' >
	>( function Link( { path, children, ...props }, ref ) {
		return (
			<a ref={ ref } data-host-link="true" href={ path } { ...props }>
				{ children }
			</a>
		);
	} ),
};

function renderWithHost( ui: ReactNode ) {
	return render(
		<WidgetHostProvider value={ { links } }>{ ui }</WidgetHostProvider>
	);
}

describe( 'HostLink', () => {
	it( 'mounts a plain anchor without a links capability', () => {
		render( <HostLink href={ MATCHED_HREF }>See report</HostLink> );

		const link = screen.getByRole( 'link', { name: 'See report' } );
		expect( link ).not.toHaveAttribute( 'data-host-link' );
		expect( link ).toHaveAttribute( 'href', MATCHED_HREF );
	} );

	it( 'mounts the host link for a target the host recognizes', () => {
		renderWithHost( <HostLink href={ MATCHED_HREF }>See report</HostLink> );

		const link = screen.getByRole( 'link', { name: 'See report' } );
		expect( link ).toHaveAttribute( 'data-host-link' );
		expect( link ).toHaveAttribute( 'href', MATCHED_PATH );
	} );

	it( 'mounts a plain anchor for a target the host does not recognize', () => {
		renderWithHost(
			<HostLink href="https://example.com">See report</HostLink>
		);

		const link = screen.getByRole( 'link', { name: 'See report' } );
		expect( link ).not.toHaveAttribute( 'data-host-link' );
		expect( link ).toHaveAttribute( 'href', 'https://example.com' );
	} );

	it.each( [ true, '', 'report.csv' ] )(
		'keeps the plain anchor for download %p',
		( download ) => {
			renderWithHost(
				<HostLink href={ MATCHED_HREF } download={ download }>
					Export
				</HostLink>
			);

			const link = screen.getByRole( 'link', { name: 'Export' } );
			expect( link ).not.toHaveAttribute( 'data-host-link' );
			expect( link ).toHaveAttribute( 'href', MATCHED_HREF );
		}
	);

	it( 'treats download false as a navigation', () => {
		renderWithHost(
			<HostLink href={ MATCHED_HREF } download={ false }>
				See report
			</HostLink>
		);

		expect(
			screen.getByRole( 'link', { name: 'See report' } )
		).toHaveAttribute( 'data-host-link' );
	} );

	it.each( [ '_blank', '_BLANK' ] )(
		'keeps the plain anchor for target %s',
		( target ) => {
			renderWithHost(
				<HostLink href={ MATCHED_HREF } target={ target }>
					Open guide
				</HostLink>
			);

			const link = screen.getByRole( 'link', { name: 'Open guide' } );
			expect( link ).not.toHaveAttribute( 'data-host-link' );
			expect( link ).toHaveAttribute( 'href', MATCHED_HREF );
		}
	);

	it( 'forwards the ref to the host link', () => {
		const ref = createRef< HTMLAnchorElement >();
		renderWithHost(
			<HostLink ref={ ref } href={ MATCHED_HREF }>
				See report
			</HostLink>
		);

		expect( ref.current ).toHaveAttribute( 'data-host-link' );
	} );

	it( 'forwards the ref to the plain anchor', () => {
		const ref = createRef< HTMLAnchorElement >();
		renderWithHost(
			<HostLink ref={ ref } href="https://example.com">
				See report
			</HostLink>
		);

		expect( ref.current ).not.toHaveAttribute( 'data-host-link' );
	} );

	it( 'carries the remaining anchor props through both branches', () => {
		const { rerender } = renderWithHost(
			<HostLink href={ MATCHED_HREF } className="action" rel="help">
				See report
			</HostLink>
		);

		let link = screen.getByRole( 'link', { name: 'See report' } );
		expect( link ).toHaveClass( 'action' );
		expect( link ).toHaveAttribute( 'rel', 'help' );

		rerender(
			<WidgetHostProvider value={ { links } }>
				<HostLink
					href="https://example.com"
					className="action"
					rel="help"
				>
					See report
				</HostLink>
			</WidgetHostProvider>
		);

		link = screen.getByRole( 'link', { name: 'See report' } );
		expect( link ).toHaveClass( 'action' );
		expect( link ).toHaveAttribute( 'rel', 'help' );
	} );
} );
