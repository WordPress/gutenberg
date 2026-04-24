/**
 * Stateless rendering engine for widget dashboards.
 *
 * Intermediate location: the engine is scoped to this route while the API
 * stabilises. Once ready it is intended to be extracted as a standalone
 * `@wordpress/dashboard` package (sibling of `@wordpress/grid`). The file
 * layout here already mirrors the target package so the move stays
 * mechanical — keep internals self-contained and avoid leaking these
 * exports outside the route.
 *
 * Public surface: the `WidgetDashboard` root with its compound children,
 * identity hooks, and the `createWidgetInstance` factory. The widget render
 * contract is intentionally minimal — see `WidgetRenderProps`.
 */

/**
 * Components
 */
export { WidgetDashboard } from './widget-dashboard';

/**
 * Hooks
 */
export { useWidgetContext } from './widget-context';
export { useWidgetDashboardContext } from './dashboard-context';

/**
 * Factory
 */
export { createWidgetInstance } from './create-widget-instance';

/**
 * Types
 */
export type {
	ResolveWidgetModule,
	WidgetBadge,
	WidgetContextValue,
	WidgetDashboardContextValue,
	WidgetDashboardProps,
	WidgetErrorConfig,
	WidgetInstance,
	WidgetModule,
	WidgetName,
	WidgetRenderProps,
	WidgetStyleVariation,
	WidgetType,
	WidgetTypeMetadata,
} from './types';
