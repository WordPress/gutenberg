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
				props: { to: string } & Record< string, unknown >,
				ref: unknown
			) => {
				const { to, ...rest } = props;
				return createElement( 'a', { ...rest, href: to, ref } );
			}
		),
	};
} );

function LinkProbe( {
	linkRef,
}: {
	linkRef: Ref< HTMLAnchorElement >;
} ): React.ReactNode {
	const { links } = useWidgetHost();

	if ( ! links ) {
		return null;
	}

	const HostLink = links.Link;

	return (
		<HostLink ref={ linkRef } path="/reports">
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
} );
