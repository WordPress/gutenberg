import { describe, expect, it } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { Suspense } from '@wordpress/element';
import { WidgetRender } from '../../components/widget-render';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '../../types';
import { WidgetIdentityProvider, useWidgetIdentity } from '../widget-identity';

describe( 'useWidgetIdentity', () => {
	it( 'defaults to no identity without a provider', () => {
		const { result } = renderHook( () => useWidgetIdentity() );

		expect( result.current ).toEqual( {} );
	} );

	it( 'exposes the provided title', () => {
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<WidgetIdentityProvider value={ { title: 'Activity' } }>
				{ children }
			</WidgetIdentityProvider>
		);

		const { result } = renderHook( () => useWidgetIdentity(), {
			wrapper,
		} );

		expect( result.current ).toEqual( { title: 'Activity' } );
	} );
} );

function ChartWidget() {
	const { title } = useWidgetIdentity();

	return <figure aria-label={ title ? `Chart: ${ title }` : 'Chart' } />;
}

const widgetType: WidgetType = {
	apiVersion: 1,
	name: 'test/sales',
	title: 'Sales by device',
	renderModule: 'sales-module',
};

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: ChartWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

describe( 'WidgetRender identity', () => {
	it( 'gives the mounted widget its type title', async () => {
		render(
			<Suspense fallback={ null }>
				<WidgetRender
					widgetType={ widgetType }
					attributes={ {} }
					resolveWidgetModule={ resolveWidgetModule }
				/>
			</Suspense>
		);

		expect(
			await screen.findByRole( 'figure', {
				name: 'Chart: Sales by device',
			} )
		).toBeInTheDocument();
	} );
} );
