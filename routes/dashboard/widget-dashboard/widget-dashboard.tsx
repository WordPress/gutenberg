/**
 * Internal dependencies
 */
import { WidgetDashboardProvider } from './context/dashboard-context';
import { WidgetDashboardUIProvider } from './context/ui-context';
import { Actions } from './components/actions';
import { Inserter } from './components/inserter';
import { WidgetChrome } from './components/widget-chrome';
import { WidgetSettings } from './components/widget-settings';
import { Widgets } from './components/widgets';
import type { WidgetDashboardProps } from './types';
import { NoWidgetsState } from './components/no-widgets-state';

/**
 * Stateless rendering engine for widget dashboards.
 *
 * The consumer owns `layout` and `editMode` state; every mutation fires
 * `onLayoutChange` with the fully updated array. The engine never queries a
 * widget-types store — types flow in via the `widgetTypes` prop.
 *
 * ```tsx
 * import { WidgetDashboard } from '@wordpress/dashboard';
 *
 * function MyDashboard() {
 * 	const [ layout, setLayout ] = useState( defaultLayout );
 * 	return (
 * 		<WidgetDashboard
 * 			layout={ layout }
 * 			onLayoutChange={ setLayout }
 * 			widgetTypes={ widgetTypes }
 * 		>
 * 			<WidgetDashboard.NoWidgetsState>
 * 				<p>No widgets yet.</p>
 * 			</WidgetDashboard.NoWidgetsState>
 * 			<WidgetDashboard.Widgets />
 * 		</WidgetDashboard>
 * 	);
 * }
 * ```
 */
export const WidgetDashboard = Object.assign(
	function WidgetDashboard( {
		layout,
		onLayoutChange,
		onLayoutReset,
		widgetTypes,
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

					<Inserter />
					<WidgetSettings />
				</WidgetDashboardUIProvider>
			</WidgetDashboardProvider>
		);
	},
	{ Actions, Widgets, WidgetChrome, NoWidgetsState }
);
