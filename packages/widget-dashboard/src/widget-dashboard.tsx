/**
 * Internal dependencies
 */
import { WidgetDashboardProvider } from './context/dashboard-context';
import { WidgetDashboardUIProvider } from './context/ui-context';
import { Actions } from './components/actions';
import { Commands } from './components/commands';
import { WidgetInserter } from './components/widget-inserter';
import { LayoutSettingsDrawer } from './components/layout-settings-drawer';
import { WidgetChrome } from './components/widget-chrome';
import { WidgetSettingsDrawer } from './components/widget-settings';
import { Widgets } from './components/widgets';
import type { WidgetDashboardProps } from './types';
import { NoWidgetsState } from './components/no-widgets-state';

/**
 * Stateless rendering engine for widget dashboards.
 *
 * The consumer owns `layout` and `editMode` state; every mutation fires
 * `onLayoutChange` with the fully updated array. The engine never queries a
 * widget store; types flow in via the `widgetTypes` prop.
 *
 * ```tsx
 * import { WidgetDashboard } from '@wordpress/widget-dashboard';
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
 * 			<WidgetDashboard.Commands />
 * 			<WidgetDashboard.LayoutSettingsDrawer />
 * 			<WidgetDashboard.WidgetInserter />
 * 			<WidgetDashboard.WidgetSettingsDrawer />
 * 		</WidgetDashboard>
 * 	);
 * }
 * ```
 *
 * Every overlay ships in the default composition: `Commands`,
 * `LayoutSettingsDrawer`, `WidgetInserter`, and `WidgetSettingsDrawer`. When
 * passing custom children, compose the ones you need; each reads its open
 * state from context and renders nothing until triggered. `Actions` drives
 * the triggers: its "Add widget" button opens `WidgetInserter`, its "Layout
 * settings" button opens `LayoutSettingsDrawer`, and the command palette's
 * "Reset to default" opens the dialog `Actions` hosts. `WidgetSettingsDrawer`
 * is opened by each tile's settings gear and works outside edit mode too.
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
							<Commands />
							<LayoutSettingsDrawer />
							<WidgetInserter />
							<WidgetSettingsDrawer />
						</>
					) }
				</WidgetDashboardUIProvider>
			</WidgetDashboardProvider>
		);
	},
	{
		Actions,
		Widgets,
		WidgetChrome,
		NoWidgetsState,
		Commands,
		LayoutSettingsDrawer,
		WidgetInserter,
		WidgetSettingsDrawer,
	}
);
