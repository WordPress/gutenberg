import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { useWidgetHost } from '@wordpress/widget-primitives';
import type { Ref } from 'react';
import { DashboardWidgetHostProvider } from '../dashboard-widget-host-provider';

jest.mock( '@wordpress/route', () => {
	const { createElement, forwardRef } =
		jest.requireActual( '@wordpress/element' );
	return {
		Link: forwardRef(
			(
				props: {
					to: string;
					search?: Record< string, string >;
				} & Record< string, unknown >,
				ref: unknown
			) => {
				const { to, search, ...rest } = props;
				const query = search
					? `?${ new URLSearchParams( search ) }`
					: '';
				return createElement( 'a', {
					...rest,
					href: `${ to }${ query }`,
					ref,
				} );
			}
		),
	};
} );

function LinkProbe( {
	linkRef,
	path = '/reports',
}: {
	linkRef: Ref< HTMLAnchorElement >;
	path?: string;
} ): React.ReactNode {
	const { links } = useWidgetHost();

	if ( ! links ) {
		return null;
	}

	const HostLink = links.Link;

	return (
		<HostLink ref={ linkRef } path={ path }>
			Reports
		</HostLink>
	);
}

describe( 'DashboardWidgetHostProvider', () => {
	it( 'provides a host Link that forwards its ref to the anchor', () => {
		const linkRef = createRef< HTMLAnchorElement >();

		render(
			<DashboardWidgetHostProvider>
				<LinkProbe linkRef={ linkRef } />
			</DashboardWidgetHostProvider>
		);

		const anchor = screen.getByRole( 'link', { name: 'Reports' } );
		expect( linkRef.current ).toBe( anchor );
		expect( anchor ).toHaveAttribute( 'href', '/reports' );
	} );

	it( 'hands the query behind the route to the router as search', () => {
		render(
			<DashboardWidgetHostProvider>
				<LinkProbe
					linkRef={ createRef< HTMLAnchorElement >() }
					path="/site-health?status=critical,recommended"
				/>
			</DashboardWidgetHostProvider>
		);

		expect(
			screen.getByRole( 'link', { name: 'Reports' } )
		).toHaveAttribute(
			'href',
			'/site-health?status=critical%2Crecommended'
		);
	} );
} );
