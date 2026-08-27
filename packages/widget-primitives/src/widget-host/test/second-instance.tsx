import { render, screen } from '@testing-library/react';
import * as element from '@wordpress/element';
import type { ReactNode } from 'react';
import { WidgetHostProvider, useWidgetHost } from '../widget-host';
import type { WidgetHostLinks } from '../widget-host';

type WidgetHostModule = typeof import('../widget-host');

const links: WidgetHostLinks = {
	match: () => '/reports',
	Link: () => null,
};

function Probe(): ReactNode {
	const host = useWidgetHost();

	return <span>{ host.links ? 'host links' : 'no capabilities' }</span>;
}

/*
 * A second instance of the package, as a bundle carrying two copies would
 * evaluate it: its own context object. React stays single in such bundles,
 * so the outer `@wordpress/element` is handed to it.
 */
function loadSecondInstance(): WidgetHostModule {
	let second: WidgetHostModule | undefined;

	jest.doMock( '@wordpress/element', () => element );
	jest.isolateModules( () => {
		second = jest.requireActual< WidgetHostModule >( '../widget-host' );
	} );
	jest.dontMock( '@wordpress/element' );

	return second as WidgetHostModule;
}

describe( 'a second instance of the package', () => {
	it( 'never reaches consumers of the first, and warns', () => {
		const second = loadSecondInstance();

		expect( second.WidgetHostProvider ).not.toBe( WidgetHostProvider );
		expect( console ).toHaveWarned();

		render(
			<second.WidgetHostProvider value={ { links } }>
				<Probe />
			</second.WidgetHostProvider>
		);

		expect( screen.getByText( 'no capabilities' ) ).toBeInTheDocument();
	} );

	it( 'is what a single instance never loses', () => {
		render(
			<WidgetHostProvider value={ { links } }>
				<Probe />
			</WidgetHostProvider>
		);

		expect( screen.getByText( 'host links' ) ).toBeInTheDocument();
	} );
} );
