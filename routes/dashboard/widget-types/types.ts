/**
 * Widget type definitions.
 *
 * Canonical home for widget identity types consumed by the registry,
 * surfaces that render widgets, and tools that author them
 * (`@wordpress/build`, schema validators, IDE autocomplete).
 */

/**
 * External dependencies
 */
import type { IconType } from '@wordpress/components';
import type { Field } from '@wordpress/dataviews';

/**
 * Widget type identifier, structured as `<widget-namespace>/<widget-name>`.
 * Both segments are lowercase, kebab-case; the full character pattern is
 * enforced by the `widget.json` schema at authoring time and validated at
 * registration time by `WIDGET_NAME_REGEXP` in `registerWidgetType`.
 */
export type WidgetName = `${ string }/${ string }`;

/**
 * Literal contents of a widget's `widget.json` metadata file.
 *
 * Captures the *authoring* shape only — module entry points and style
 * assets are discovered by convention from the widget directory
 * (`render.*`, `widget.*`, `render.scss`), not declared here.
 *
 * Consumed by tooling (IDE autocomplete, validation, the build pipeline).
 * Surfaces that render widgets consume the richer `WidgetType` below,
 * which extends this shape with runtime-only fields produced by the
 * build manifest.
 */
export interface WidgetTypeMetadata {
	/**
	 * Version of the Widget API used by the widget.
	 */
	apiVersion: number;

	/**
	 * Stable type identifier. See `WidgetName` for the shape.
	 */
	name: WidgetName;

	/**
	 * Display title; shown in the inserter.
	 */
	title: string;

	/**
	 * Short description shown in the widget inspector.
	 */
	description?: string;

	/**
	 * Visual identifier shown in the widget header; dashicon string, React node, or SVG component.
	 */
	icon?: IconType;

	/**
	 * Grouping category. Core provides `dashboard`; plugins and themes may
	 * register custom categories.
	 */
	category?: string;

	/**
	 * Search aliases used to surface the widget from the inserter.
	 */
	keywords?: string[];

	/**
	 * Widget version — used for asset cache invalidation.
	 */
	version?: string;

	/**
	 * Experiment gate — boolean `true`, or a specific experiment name.
	 */
	__experimental?: string | boolean;

	/**
	 * Declarative attribute schema, reusing the DataViews `Field` shape so
	 * surfaces can render forms via `DataForm` without per-widget form
	 * wiring. `Field< any >` is used here because the array is
	 * heterogeneous — each widget narrows `Item` to its own attribute type
	 * at the point of registration.
	 */
	attributes?: Field< any >[];

	/**
	 * Structured example data for the Inspector Help Panel preview, and the
	 * default attributes applied when a new instance is created without
	 * initial attributes.
	 */
	example?: {
		attributes?: Record< string, unknown >;
	};
}

/**
 * Runtime widget type consumed by surfaces.
 *
 * Extends `WidgetTypeMetadata` (the authoring shape of `widget.json`) with
 * runtime-only fields produced by the build pipeline. Notably
 * `renderModule`, which maps each widget to its discovered script-module
 * entry point.
 *
 * The PHP layer (`widget-types.php`) emits this data in snake_case
 * (`render_module`). The `getWidgetTypes` resolver is the single boundary
 * that maps it to the camelCase shape consumed throughout JS/TS.
 */
export interface WidgetType extends WidgetTypeMetadata {
	/**
	 * Script-module identifier resolved to a React component at render
	 * time. Produced by the build pipeline from the conventional
	 * `render.*` / `widget.*` entry points; not declared in `widget.json`.
	 */
	renderModule: string;
}
