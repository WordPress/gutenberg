/**
 * External dependencies
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as commandsStore } from '@wordpress/commands';

/**
 * Internal dependencies
 */
import { WidgetDashboard } from '../widget-dashboard';
import { DASHBOARD_COMMAND_CONTEXT } from '../components/dashboard-commands';
import type { DashboardWidget, WidgetType } from '../types';

const widgetTypes: WidgetType[] = [];

const layout: DashboardWidget[] = [
	{ uuid: 'a', type: 'core/test', placement: { width: 1, height: 1 } },
];

function CommandsProbe() {
	const { context, customizeCommand } = useSelect( ( select ) => {
		const { getContext, getCommands } = select( commandsStore );
		const contextualCommands = getCommands( true );
		return {
			context: getContext(),
			customizeCommand: contextualCommands.find(
				( command ) => command.name === 'core/dashboard/customize'
			),
		};
	}, [] );

	return (
		<div
			data-testid="commands-probe"
			data-context={ context }
			data-has-customize={ customizeCommand ? 'yes' : 'no' }
		/>
	);
}

function Harness( { initialEditMode = false }: { initialEditMode?: boolean } ) {
	const [ editMode, setEditMode ] = useState( initialEditMode );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ () => {} }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ setEditMode }
		>
			<CommandsProbe />
		</WidgetDashboard>
	);
}

describe( 'WidgetDashboard.DashboardCommands', () => {
	it( 'sets the dashboard command context and registers Customize', () => {
		render( <Harness /> );
		const probe = screen.getByTestId( 'commands-probe' );

		expect( probe ).toHaveAttribute(
			'data-context',
			DASHBOARD_COMMAND_CONTEXT
		);
		expect( probe ).toHaveAttribute( 'data-has-customize', 'yes' );
	} );

	it( 'unregisters Customize while edit mode is active', () => {
		render( <Harness initialEditMode /> );

		expect( screen.getByTestId( 'commands-probe' ) ).toHaveAttribute(
			'data-has-customize',
			'no'
		);
	} );
} );
