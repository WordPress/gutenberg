/**
 * External dependencies
 */
import '@testing-library/jest-dom';
import { act, render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useRemoveDashboardWidget } from '../hooks/use-remove-dashboard-widget';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget, WidgetType } from '../types';

const widgetTypes: WidgetType[] = [];

const initialLayout: DashboardWidget[] = [
	{ uuid: 'keep', type: 'core/test', placement: { width: 1, height: 1 } },
	{
		uuid: 'remove-me',
		type: 'core/test',
		placement: { width: 1, height: 1 },
	},
];

interface ProbeApi {
	remove: () => void;
}

const probeRef: { current: ProbeApi | null } = { current: null };

function Probe( { uuid }: { uuid: string } ) {
	const remove = useRemoveDashboardWidget( uuid );
	useEffect( () => {
		probeRef.current = { remove };
	} );
	return null;
}

function readProbe(): ProbeApi {
	if ( ! probeRef.current ) {
		throw new Error( 'Probe not mounted yet' );
	}
	return probeRef.current;
}

describe( 'useRemoveDashboardWidget', () => {
	it( 'commits immediately when not in edit mode', () => {
		const onLayoutChange = jest.fn();

		render(
			<WidgetDashboard
				layout={ initialLayout }
				onLayoutChange={ onLayoutChange }
				widgetTypes={ widgetTypes }
				editMode={ false }
			>
				<Probe uuid="remove-me" />
			</WidgetDashboard>
		);

		act( () => {
			readProbe().remove();
		} );

		expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
		expect( onLayoutChange ).toHaveBeenCalledWith( [ initialLayout[ 0 ] ] );
	} );

	it( 'stages removal in edit mode until commit', () => {
		const onLayoutChange = jest.fn();

		render(
			<WidgetDashboard
				layout={ initialLayout }
				onLayoutChange={ onLayoutChange }
				widgetTypes={ widgetTypes }
				editMode
			>
				<Probe uuid="remove-me" />
			</WidgetDashboard>
		);

		act( () => {
			readProbe().remove();
		} );

		expect( onLayoutChange ).not.toHaveBeenCalled();
	} );
} );
