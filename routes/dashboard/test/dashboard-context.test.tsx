/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	useWidgetDashboardContext,
	WidgetDashboardProvider,
} from '../dashboard-context';
import { useWidgetContext } from '../widget-context';

const DASHBOARD_ID = 'core/dashboard';

function CaptureDashboardId( {
	onRender,
}: {
	onRender: ( id: string ) => void;
} ) {
	const { id } = useWidgetDashboardContext();
	onRender( id );
	return null;
}

function CaptureWidgetContext( {
	onRender,
}: {
	onRender: ( value: ReturnType< typeof useWidgetContext > ) => void;
} ) {
	onRender( useWidgetContext() );
	return null;
}

describe( 'useWidgetDashboardContext', () => {
	it( 'throws when used outside a WidgetDashboard subtree', () => {
		const spy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );
		expect( () =>
			render( <CaptureDashboardId onRender={ () => {} } /> )
		).toThrow(
			'useWidgetDashboardContext must be used within a WidgetDashboard.'
		);
		spy.mockRestore();
	} );

	it( 'returns the dashboard id inside the provider', () => {
		const handler = jest.fn();
		render(
			<WidgetDashboardProvider
				id={ DASHBOARD_ID }
				widgetTypes={ [] }
				layout={ [] }
				onLayoutChange={ () => {} }
			>
				<CaptureDashboardId onRender={ handler } />
			</WidgetDashboardProvider>
		);
		expect( handler ).toHaveBeenCalledWith( DASHBOARD_ID );
	} );
} );

describe( 'useWidgetContext', () => {
	it( 'returns null outside a widget render subtree', () => {
		const handler = jest.fn();
		render( <CaptureWidgetContext onRender={ handler } /> );
		expect( handler ).toHaveBeenCalledWith( null );
	} );
} );
