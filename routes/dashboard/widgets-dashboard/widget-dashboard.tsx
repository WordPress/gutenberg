/**
 * Internal dependencies
 */
import { WidgetDashboardProvider } from './dashboard-context';
import { Empty } from './empty';
import { Widget } from './widget';
import { Widgets } from './widgets';
import type { WidgetDashboardProps } from './types';

/**
 * Stateless rendering engine for widget dashboards.
 *
 * Follows the DataViews stateless-pure pattern: the consumer owns `layout`
 * and `editMode` state, and every mutation fires `onLayoutChange` with the
 * fully updated array. The engine never queries a widget-types store — types
 * flow in via the `widgetTypes` prop.
 *
 * The `id` prop is required and exposed via `useWidgetDashboardContext()`
 * so consumers can scope persistence keys and extension filters to this
 * specific dashboard. Multiple dashboards can coexist in the same admin and
 * stay independently addressable.
 *
 * ```tsx
 * import { WidgetDashboard } from '@wordpress/dashboard';
 *
 * function MyDashboard() {
 * 	const [ layout, setLayout ] = useState( defaultLayout );
 * 	return (
 * 		<WidgetDashboard
 * 			id="core/dashboard"
 * 			layout={ layout }
 * 			onLayoutChange={ setLayout }
 * 			widgetTypes={ widgetTypes }
 * 		>
 * 			<WidgetDashboard.Empty>
 * 				<p>No widgets yet.</p>
 * 			</WidgetDashboard.Empty>
 * 			<WidgetDashboard.Widgets />
 * 		</WidgetDashboard>
 * 	);
 * }
 * ```
 */
export const WidgetDashboard = Object.assign(
	function WidgetDashboard( {
		id,
		layout,
		onLayoutChange,
		widgetTypes,
		editMode,
		onEditChange,
		resolveWidgetModule,
		columns,
		minColumnWidth,
		rowHeight,
		spacing,
		children,
	}: WidgetDashboardProps ) {
		return (
			<WidgetDashboardProvider
				id={ id }
				layout={ layout }
				onLayoutChange={ onLayoutChange }
				widgetTypes={ widgetTypes }
				editMode={ editMode }
				onEditChange={ onEditChange }
				resolveWidgetModule={ resolveWidgetModule }
				columns={ columns }
				minColumnWidth={ minColumnWidth }
				rowHeight={ rowHeight }
				spacing={ spacing }
			>
				{ children ?? <Widgets /> }
			</WidgetDashboardProvider>
		);
	},
	{ Widgets, Widget, Empty }
);
