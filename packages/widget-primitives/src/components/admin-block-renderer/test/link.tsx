import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { forwardRef } from '@wordpress/element';
import type { ComponentPropsWithoutRef } from 'react';
import '../admin-blocks/link';
import { AdminBlockRenderer } from '../admin-block-renderer';
import { WidgetHostProvider } from '../../../widget-host';
import type { WidgetHostLinks } from '../../../widget-host';

const CONTENT =
	'<!-- wp:core-admin/link {"href":"admin.php?page=dashboard&p=/site-health","label":"Review all results"} /-->';

const HostLink = forwardRef<
	HTMLAnchorElement,
	{ path: string } & Omit< ComponentPropsWithoutRef< 'a' >, 'href' >
>( function HostLink( { path, children, ...props }, ref ) {
	return (
		<a ref={ ref } data-host-link="true" href={ path } { ...props }>
			{ children }
		</a>
	);
} );

const links: WidgetHostLinks = {
	match: ( href ) =>
		href === 'admin.php?page=dashboard&p=/site-health'
			? '/site-health'
			: null,
	Link: HostLink,
};

describe( 'core-admin/link', () => {
	it( 'mounts the host link when the host recognizes the href', () => {
		render(
			<WidgetHostProvider value={ { links } }>
				<AdminBlockRenderer content={ CONTENT } />
			</WidgetHostProvider>
		);

		const link = screen.getByRole( 'link', { name: 'Review all results' } );
		expect( link ).toHaveAttribute( 'data-host-link' );
		expect( link ).toHaveAttribute( 'href', '/site-health' );
	} );

	it( 'stays a plain anchor without the capability', () => {
		render( <AdminBlockRenderer content={ CONTENT } /> );

		const link = screen.getByRole( 'link', { name: 'Review all results' } );
		expect( link ).not.toHaveAttribute( 'data-host-link' );
		expect( link ).toHaveAttribute(
			'href',
			'admin.php?page=dashboard&p=/site-health'
		);
	} );
} );
