/**
 * Internal dependencies
 */
import { WidgetDashboardProvider } from './context/dashboard-context';
import { Widget } from './components/widget';
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
		widgetTypes,
		editMode,
		onEditChange,
		resolveWidgetModule,
		gridSettings,
		children,
	}: WidgetDashboardProps ) {
		return (
			<WidgetDashboardProvider
				layout={ layout }
				onLayoutChange={ onLayoutChange }
				widgetTypes={ widgetTypes }
				editMode={ editMode }
				onEditChange={ onEditChange }
				resolveWidgetModule={ resolveWidgetModule }
				gridSettings={ gridSettings }
			>
				{ children ?? (
					<>
						<NoWidgetsState />
						<Widgets />
					</>
				) }
			</WidgetDashboardProvider>
		);
	},
	{ Widgets, Widget, NoWidgetsState }
);
