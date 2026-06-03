/**
 * Internal dependencies
 */
import { WidgetDashboardProvider } from './context/dashboard-context';
import { WidgetDashboardUIProvider } from './context/ui-context';
import { Actions } from './components/actions';
import { DashboardCommands } from './components/dashboard-commands';
import { Inserter } from './components/inserter';
import { DashboardWidgetChrome } from './components/dashboard-widget-chrome';
import { WidgetSettings } from './components/widget-settings';
import { Widgets } from './components/widgets';
import type { WidgetDashboardProps } from './types';
import { NoWidgetsState } from './components/no-widgets-state';

/**
 * Stateless rendering engine for widget dashboards.
 *
 * The consumer owns `layout` and `editMode` state; every mutation fires
 * `onLayoutChange` with the fully updated array. The engine never queries a
 * widget-primitives store; types flow in via the `widgetTypes` prop.
 *
 * ```tsx
 * import { WidgetDashboard } from '@wordpress/dashboard';
 *
 * function MyDashboard() {
 * 	const [ layout, setLayout ] = useState( defaultLayout );
 * 	const [ editMode, setEditMode ] = useState( false );
 * 	return (
 * 		<WidgetDashboard
 * 			layout={ layout }
 * 			onLayoutChange={ setLayout }
 * 			widgetTypes={ widgetTypes }
 * 			editMode={ editMode }
 * 			onEditChange={ setEditMode }
 * 		>
 * 			<WidgetDashboard.NoWidgetsState>
 * 				<p>No widgets yet.</p>
 * 			</WidgetDashboard.NoWidgetsState>
 * 			<WidgetDashboard.Actions />
 * 			<WidgetDashboard.Widgets />
 * 		</WidgetDashboard>
 * 	);
 * }
 * ```
 *
 * `Actions` hosts the reset dialog, so include it (or rely on the default
 * children) for the command-palette "Reset to default" action to work.
 */
export const WidgetDashboard = Object.assign(
	function WidgetDashboard( {
		layout,
		onLayoutChange,
		onLayoutReset,
		widgetTypes,
		isResolvingWidgetTypes,
		editMode,
		onEditChange,
		resolveWidgetModule,
		gridSettings,
		onGridSettingsChange,
		children,
	}: WidgetDashboardProps ) {
		return (
			<WidgetDashboardProvider
				layout={ layout }
				onLayoutChange={ onLayoutChange }
				onLayoutReset={ onLayoutReset }
				widgetTypes={ widgetTypes }
				isResolvingWidgetTypes={ isResolvingWidgetTypes }
				editMode={ editMode }
				onEditChange={ onEditChange }
				resolveWidgetModule={ resolveWidgetModule }
				gridSettings={ gridSettings }
				onGridSettingsChange={ onGridSettingsChange }
			>
				<WidgetDashboardUIProvider>
					{ children ?? (
						<>
							<NoWidgetsState />
							<Actions />
							<Widgets />
						</>
					) }

					<DashboardCommands />
					<Inserter />
					<WidgetSettings />
				</WidgetDashboardUIProvider>
			</WidgetDashboardProvider>
		);
	},
	{ Actions, Widgets, WidgetChrome: DashboardWidgetChrome, NoWidgetsState }
);
