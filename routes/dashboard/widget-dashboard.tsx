/**
 * Internal dependencies
 */
import { WidgetDashboardProvider } from './dashboard-context';
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
 * @param root0
 * @param root0.id
 * @param root0.layout
 * @param root0.onLayoutChange
 * @param root0.widgetTypes
 * @param root0.editMode
 * @param root0.onEditChange
 * @param root0.resolveWidgetModule
 * @param root0.columns
 * @param root0.minColumnWidth
 * @param root0.collapseWidth
 * @param root0.rowHeight
 * @param root0.spacing
 * @param root0.onWidgetError
 * @param root0.empty
 * @param root0.children
 * @example
 * ```tsx
 * import { WidgetDashboard } from '@wordpress/dashboard';
 *
 * function MyDashboard() {
 *     const [ layout, setLayout ] = useState( defaultLayout );
 *     return (
 *         <WidgetDashboard
 *             id="core/dashboard"
 *             layout={ layout }
 *             onLayoutChange={ setLayout }
 *             widgetTypes={ widgetTypes }
 *         />
 *     );
 * }
 * ```
 */
export function WidgetDashboard( {
	id,
	layout,
	onLayoutChange,
	widgetTypes,
	editMode,
	onEditChange,
	resolveWidgetModule,
	columns,
	minColumnWidth,
	collapseWidth,
	rowHeight,
	spacing,
	onWidgetError,
	empty,
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
			collapseWidth={ collapseWidth }
			rowHeight={ rowHeight }
			spacing={ spacing }
			onWidgetError={ onWidgetError }
		>
			{ children ??
				( layout.length === 0 && empty ? (
					empty
				) : (
					<WidgetDashboard.Widgets />
				) ) }
		</WidgetDashboardProvider>
	);
}

WidgetDashboard.Widgets = Widgets;
WidgetDashboard.Widget = Widget;
