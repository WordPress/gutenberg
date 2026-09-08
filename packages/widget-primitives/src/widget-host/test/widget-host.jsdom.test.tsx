import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { WidgetHostProvider, useWidgetHost } from '../widget-host';
import type { WidgetHostLinks } from '../widget-host';

const links: WidgetHostLinks = {
	match: () => '/reports',
	Link: () => null,
};

const otherLinks: WidgetHostLinks = {
	match: () => null,
	Link: () => null,
};

describe( 'useWidgetHost', () => {
	it( 'defaults to no capabilities without a provider', () => {
		const { result } = renderHook( () => useWidgetHost() );

		expect( result.current ).toEqual( {} );
	} );

	it( 'exposes the provided capabilities', () => {
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<WidgetHostProvider value={ { links } }>
				{ children }
			</WidgetHostProvider>
		);

		const { result } = renderHook( () => useWidgetHost(), { wrapper } );

		expect( result.current.links ).toBe( links );
	} );

	it( 'keeps inherited capabilities a nested provider does not set', () => {
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<WidgetHostProvider value={ { links } }>
				<WidgetHostProvider value={ {} }>
					{ children }
				</WidgetHostProvider>
			</WidgetHostProvider>
		);

		const { result } = renderHook( () => useWidgetHost(), { wrapper } );

		expect( result.current.links ).toBe( links );
	} );

	it( 'lets a nested provider override an inherited capability', () => {
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<WidgetHostProvider value={ { links } }>
				<WidgetHostProvider value={ { links: otherLinks } }>
					{ children }
				</WidgetHostProvider>
			</WidgetHostProvider>
		);

		const { result } = renderHook( () => useWidgetHost(), { wrapper } );

		expect( result.current.links ).toBe( otherLinks );
	} );
} );
