import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as commandsStore } from '@wordpress/commands';
import type { WidgetType } from '@wordpress/widget-primitives';
import { WidgetDashboard } from '../widget-dashboard';
import { DASHBOARD_COMMAND_CONTEXT } from '../components/commands';
import type { CanPerformDashboardOperation, DashboardWidget } from '../types';

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'core/test',
		title: 'Test',
		renderModule: 'test-module',
	},
];

const layout: DashboardWidget[] = [
	{ uuid: 'a', type: 'core/test', placement: { width: 1, height: 1 } },
];

function CommandsProbe( { names }: { names: string[] } ) {
	const context = useSelect(
		( select ) => select( commandsStore ).getContext(),
		[]
	);
	const contextualCommands = useSelect(
		( select ) => select( commandsStore ).getCommands( true ),
		[]
	);

	const registered = useMemo(
		() =>
			Object.fromEntries(
				names.map( ( name ) => [
					name,
					contextualCommands.some(
						( command ) => command.name === name
					),
				] )
			),
		[ names, contextualCommands ]
	);

	return (
		<div
			data-testid="commands-probe"
			data-context={ context }
			data-registered={ JSON.stringify( registered ) }
		/>
	);
}

const COMMAND_NAMES = [
	'core/dashboard/customize',
	'core/dashboard/add-widgets',
	'core/dashboard/reset-to-default',
	// Removed commands, probed to assert they stay unregistered.
	'core/dashboard/switch-to-masonry-layout',
	'core/dashboard/switch-to-grid-layout',
];

interface HarnessProps {
	initialEditMode?: boolean;
	withLayoutReset?: boolean;
	canPerform?: CanPerformDashboardOperation;
}

function Harness( {
	initialEditMode = false,
	withLayoutReset = false,
	canPerform,
}: HarnessProps ) {
	const [ editMode, setEditMode ] = useState( initialEditMode );

	const dashboard = (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ () => {} }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ setEditMode }
			onLayoutReset={ withLayoutReset ? async () => {} : undefined }
		>
			<WidgetDashboard.Commands />
			<CommandsProbe names={ COMMAND_NAMES } />
		</WidgetDashboard>
	);

	return canPerform ? (
		<WidgetDashboard.Policy canPerform={ canPerform }>
			{ dashboard }
		</WidgetDashboard.Policy>
	) : (
		dashboard
	);
}

const denyCustomize: CanPerformDashboardOperation = ( request ) =>
	request.operation !== 'customize';

const denyReset: CanPerformDashboardOperation = ( request ) =>
	request.operation !== 'reset';

function getRegistered( probe: HTMLElement ): Record< string, boolean > {
	return JSON.parse( probe.getAttribute( 'data-registered' ) ?? '{}' );
}

describe( 'WidgetDashboard.Commands', () => {
	it( 'sets the dashboard command context and registers core commands', () => {
		render( <Harness withLayoutReset /> );
		const probe = screen.getByTestId( 'commands-probe' );
		const registered = getRegistered( probe );

		expect( probe ).toHaveAttribute(
			'data-context',
			DASHBOARD_COMMAND_CONTEXT
		);
		expect( registered[ 'core/dashboard/customize' ] ).toBe( true );
		expect( registered[ 'core/dashboard/add-widgets' ] ).toBe( true );
		expect( registered[ 'core/dashboard/reset-to-default' ] ).toBe( true );
	} );

	it( 'unregisters Customize while edit mode is active', () => {
		render( <Harness initialEditMode withLayoutReset /> );
		const registered = getRegistered(
			screen.getByTestId( 'commands-probe' )
		);

		expect( registered[ 'core/dashboard/customize' ] ).toBe( false );
		expect( registered[ 'core/dashboard/add-widgets' ] ).toBe( true );
	} );

	it( 'unregisters Customize and Add widgets when the policy denies customize', () => {
		render( <Harness withLayoutReset canPerform={ denyCustomize } /> );

		const registered = getRegistered(
			screen.getByTestId( 'commands-probe' )
		);
		expect( registered[ 'core/dashboard/customize' ] ).toBe( false );
		expect( registered[ 'core/dashboard/add-widgets' ] ).toBe( false );
		expect( registered[ 'core/dashboard/reset-to-default' ] ).toBe( true );
	} );

	it( 'keeps Add widgets registered in edit mode when customize is denied', () => {
		render( <Harness initialEditMode canPerform={ denyCustomize } /> );

		const registered = getRegistered(
			screen.getByTestId( 'commands-probe' )
		);
		expect( registered[ 'core/dashboard/add-widgets' ] ).toBe( true );
	} );

	it( 'unregisters Reset to default when the policy denies reset', () => {
		render( <Harness withLayoutReset canPerform={ denyReset } /> );

		const registered = getRegistered(
			screen.getByTestId( 'commands-probe' )
		);
		expect( registered[ 'core/dashboard/reset-to-default' ] ).toBe( false );
		expect( registered[ 'core/dashboard/customize' ] ).toBe( true );
		expect( registered[ 'core/dashboard/add-widgets' ] ).toBe( true );
	} );

	it( 'does not register layout-model switch commands', () => {
		render( <Harness withLayoutReset /> );
		const registered = getRegistered(
			screen.getByTestId( 'commands-probe' )
		);

		expect( registered[ 'core/dashboard/switch-to-masonry-layout' ] ).toBe(
			false
		);
		expect( registered[ 'core/dashboard/switch-to-grid-layout' ] ).toBe(
			false
		);
	} );
} );
