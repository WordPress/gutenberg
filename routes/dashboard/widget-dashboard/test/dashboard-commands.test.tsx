/**
 * External dependencies
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as commandsStore } from '@wordpress/commands';

/**
 * Internal dependencies
 */
import { WidgetDashboard } from '../widget-dashboard';
import { DASHBOARD_COMMAND_CONTEXT } from '../components/dashboard-commands';
import type { DashboardWidget } from '../types';
import type { WidgetType } from '../../widget-primitives';

const widgetTypes: WidgetType[] = [];

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
	'core/dashboard/switch-to-masonry-layout',
	'core/dashboard/switch-to-grid-layout',
	'core/dashboard/reset-to-default',
];

interface HarnessProps {
	initialEditMode?: boolean;
	withGridSettings?: boolean;
	withLayoutReset?: boolean;
	gridModel?: 'grid' | 'masonry';
}

function Harness( {
	initialEditMode = false,
	withGridSettings = false,
	withLayoutReset = false,
	gridModel = 'grid',
}: HarnessProps ) {
	const [ editMode, setEditMode ] = useState( initialEditMode );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ () => {} }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ setEditMode }
			onLayoutReset={ withLayoutReset ? async () => {} : undefined }
			gridSettings={
				withGridSettings ? { model: gridModel, columns: 6 } : undefined
			}
			onGridSettingsChange={ withGridSettings ? () => {} : undefined }
		>
			<CommandsProbe names={ COMMAND_NAMES } />
		</WidgetDashboard>
	);
}

function getRegistered( probe: HTMLElement ): Record< string, boolean > {
	return JSON.parse( probe.getAttribute( 'data-registered' ) ?? '{}' );
}

describe( 'WidgetDashboard.DashboardCommands', () => {
	it( 'sets the dashboard command context and registers core commands', () => {
		render( <Harness withGridSettings withLayoutReset /> );
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
		render( <Harness initialEditMode withGridSettings withLayoutReset /> );
		const registered = getRegistered(
			screen.getByTestId( 'commands-probe' )
		);

		expect( registered[ 'core/dashboard/customize' ] ).toBe( false );
		expect( registered[ 'core/dashboard/add-widgets' ] ).toBe( true );
	} );

	it( 'disables layout commands while edit mode is active', () => {
		render(
			<Harness
				initialEditMode
				withGridSettings
				withLayoutReset
				gridModel="grid"
			/>
		);
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

	it( 'only registers the active layout-model switch command', () => {
		render( <Harness withGridSettings withLayoutReset gridModel="grid" /> );
		const registered = getRegistered(
			screen.getByTestId( 'commands-probe' )
		);

		expect( registered[ 'core/dashboard/switch-to-masonry-layout' ] ).toBe(
			true
		);
		expect( registered[ 'core/dashboard/switch-to-grid-layout' ] ).toBe(
			false
		);
	} );

	it( 'omits grid-settings commands when grid settings are not editable', () => {
		render( <Harness withLayoutReset /> );
		const registered = getRegistered(
			screen.getByTestId( 'commands-probe' )
		);

		expect( registered[ 'core/dashboard/switch-to-masonry-layout' ] ).toBe(
			false
		);
	} );
} );
