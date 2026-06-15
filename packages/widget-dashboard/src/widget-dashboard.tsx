/**
 * Internal dependencies
 */
import { WidgetDashboardProvider } from './context/dashboard-context';
import { WidgetDashboardUIProvider } from './context/ui-context';
import { Actions } from './components/actions';
import { Commands } from './components/commands';
import { LayoutSettings } from './components/layout-settings';
import { NoWidgetsState } from './components/no-widgets-state';
import { ResetConfirmation } from './components/reset-confirmation';
import { WidgetChrome } from './components/widget-chrome';
import { WidgetInserter } from './components/widget-inserter';
import { WidgetSettings } from './components/widget-settings';
import { Widgets } from './components/widgets';
import type { WidgetDashboardProps } from './types';

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
 * 		</WidgetDashboard>
 * 	);
 * }
 * ```
 *
 * Children compose the dashboard's triggers and chrome: `Actions`,
 * `Widgets`, `Commands`, `NoWidgetsState`. The targets they open (the
 * widget inserter, the layout and widget settings editors, the reset
 * confirmation) are mounted by the engine and driven by shared UI state, so
 * a trigger works wherever it is composed without a matching target in the
 * tree. Omitting `children` renders the default arrangement.
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
						</>
					) }

					<WidgetInserter />
					<LayoutSettings />
					<WidgetSettings />
					<ResetConfirmation />
				</WidgetDashboardUIProvider>
			</WidgetDashboardProvider>
		);
	},
	{ Actions, Widgets, WidgetChrome, NoWidgetsState, Commands }
);
