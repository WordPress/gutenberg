/**
 * Widget type definitions.
 *
 * Canonical home for widget identity types consumed by the registry,
 * surfaces that render widgets, and tools that author them
 * (`@wordpress/build`, schema validators, IDE autocomplete).
 *
 * Each type is generic over the widget's attribute object (`Item`) so a
 * widget binds its own attribute shape once and gets typed `attributes`,
 * `example`, and `setAttributes` throughout the framework.
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
 * Captures the *authoring* shape only; module entry points and style
 * assets are discovered by convention from the widget directory
 * (`render.*`, `widget.*`, `render.scss`), not declared here.
 *
 * Consumed by tooling (IDE autocomplete, validation, the build pipeline).
 * Surfaces that render widgets consume the richer `WidgetType` below,
 * which extends this shape with runtime-only fields produced by the
 * build manifest.
 */
export interface WidgetTypeMetadata< Item = unknown > {
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
	 * Authoring intent about how the widget wants to render. Static
	 * and declarative; not a user-editable attribute.
	 *
	 * - `'framed'` (default when absent): the widget renders its
	 *   content only.
	 * - `'full-bleed'`: the widget renders edge-to-edge with no
	 *   surrounding chrome.
	 */
	presentation?: 'framed' | 'full-bleed';

	/**
	 * Search aliases used to surface the widget from the inserter.
	 */
	keywords?: string[];

	/**
	 * Widget version, used for asset cache invalidation.
	 */
	version?: string;

	/**
	 * Gettext text domain for translations.
	 */
	textdomain?: string;

	/**
	 * Experiment gate; boolean `true`, or a specific experiment name.
	 */
	__experimental?: string | boolean;

	/**
	 * Declarative attribute schema, bound to the widget's attribute
	 * object via `Item`. Surfaces render forms straight from this list
	 * via `DataForm`, with no per-widget form wiring.
	 */
	attributes?: Field< Item >[];

	/**
	 * Structured example data for the Inspector Help Panel preview, and
	 * the default attributes applied when a new instance is created
	 * without initial attributes.
	 */
	example?: {
		attributes?: Partial< Item >;
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
export interface WidgetType< Item = unknown >
	extends WidgetTypeMetadata< Item > {
	/**
	 * Script-module identifier resolved to a React component at render
	 * time. Produced by the build pipeline from the conventional
	 * `render.*` / `widget.*` entry points; not declared in `widget.json`.
	 */
	renderModule: string;
}

/**
 * Props passed to a widget's render component by the consuming surface.
 *
 * Bound over `Item` so the destructured `attributes` and any
 * `setAttributes` payload are typed against the widget's attribute
 * object.
 */
export interface WidgetRenderProps< Item = unknown > {
	/**
	 * User-configured attributes for this widget instance.
	 */
	attributes: Item;

	/**
	 * Updates the attributes of this instance. Optional because some
	 * surfaces render widgets in read-only contexts.
	 */
	setAttributes?: ( next: Partial< Item > ) => void;
}
