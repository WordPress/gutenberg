/**
 * Widget type definitions.
 *
 * Canonical home for widget identity types consumed by the registry and
 * hosts that render widgets.
 *
 * Each type is generic over the widget's attribute object (`Item`), so a
 * widget binds its attribute shape once and gets typed `attributes`,
 * `example`, and `setAttributes`.
 */

/**
 * External dependencies
 */
import type { ComponentProps, ComponentType, ReactElement } from 'react';
import type { Field } from '@wordpress/dataviews';

/**
 * Widget type identifier, structured as `<widget-namespace>/<widget-name>`.
 * Both segments are lowercase, kebab-case.
 */
export type WidgetName = `${ string }/${ string }`;

/**
 * Icon for a widget type: a rendered SVG element, typically one from
 * `@wordpress/icons`.
 */
export type WidgetIcon = ReactElement< ComponentProps< 'svg' > >;

/**
 * Literal contents of a widget's `widget.json` metadata file.
 *
 * Captures the *authoring* shape only; module entry points and style
 * assets are discovered by convention from the widget directory, not
 * declared here.
 */
export interface WidgetTypeMetadata< Item = unknown > {
	/**
	 * Version of the Widget API used by the widget.
	 */
	apiVersion: number;

	/**
	 * Stable type identifier.
	 */
	name: WidgetName;

	/**
	 * Display title; hosts surface it in pickers and chrome.
	 */
	title: string;

	/**
	 * Short description; hosts surface it in pickers and help panels.
	 */
	description?: string;

	/**
	 * Visual identifier for the widget type; hosts decide where, and
	 * whether, to render it.
	 */
	icon?: WidgetIcon;

	/**
	 * Grouping category. Core provides `dashboard`; plugins and themes may
	 * register custom categories.
	 */
	category?: string;

	/**
	 * Authoring intent about how the widget renders. Not a user-editable
	 * attribute.
	 *
	 * - `'framed'` (default when absent): the widget renders its
	 *   content only.
	 * - `'content-bleed'`: the host's chrome stays visible while the
	 *   content fills the content area edge-to-edge, with no padding.
	 * - `'full-bleed'`: the widget renders edge-to-edge with no
	 *   surrounding chrome.
	 */
	presentation?: 'framed' | 'content-bleed' | 'full-bleed';

	/**
	 * Search aliases hosts use to match the widget in their pickers.
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
	 * object via `Item`. Hosts render forms straight from this list
	 * via `DataForm`, with no per-widget form wiring.
	 */
	attributes?: Field< Item >[];

	/**
	 * Structured example data hosts use for previews, and the default
	 * attributes applied when a new instance is created without initial
	 * attributes.
	 */
	example?: {
		attributes?: Partial< Item >;
	};
}

/**
 * Runtime widget type consumed by hosts.
 *
 * Extends `WidgetTypeMetadata` with runtime-only fields, notably
 * `renderModule`. Hosts supply the raw records in snake_case
 * (`WidgetModuleRecord`); `useWidgetTypes` is the single boundary that
 * resolves them into this camelCase shape.
 */
export interface WidgetType< Item = unknown >
	extends WidgetTypeMetadata< Item > {
	/**
	 * Script-module identifier resolved to a React component at render
	 * time, produced from the conventional `render.*` entry point.
	 */
	renderModule: string;
}

/**
 * Props passed to a widget's render component by the host, bound over
 * `Item` so `attributes` and `setAttributes` are typed against the
 * widget's attribute object.
 */
export interface WidgetRenderProps< Item = unknown > {
	/**
	 * User-configured attributes for this widget instance.
	 */
	attributes: Item;

	/**
	 * Updates the attributes of this instance. Optional because some
	 * hosts render widgets in read-only contexts.
	 */
	setAttributes?: ( next: Partial< Item > ) => void;
}

/**
 * Widget render module shape returned by the module resolver.
 */
export interface WidgetModule {
	default: ComponentType< WidgetRenderProps< unknown > >;
}

/**
 * Resolver function: maps a `WidgetType.renderModule` id to a React
 * component. Override for tests, Storybook, or to load from a non-URL
 * source.
 */
export type ResolveWidgetModule = (
	moduleId: string
) => Promise< WidgetModule >;

/**
 * Per-widget record a host feeds to `useWidgetTypes`, in snake_case wire
 * format. The host fetches these however it likes; only the field shape is
 * part of the contract.
 */
export interface WidgetModuleRecord {
	/**
	 * Stable widget type identifier.
	 */
	name: string;

	/**
	 * Script-module id resolved to the render component at render time.
	 */
	render_module?: string | null;

	/**
	 * Script-module id dynamically imported for the widget's live metadata.
	 */
	widget_module?: string | null;

	/**
	 * Authoring presentation hint; overrides the metadata module's value.
	 */
	presentation?: WidgetTypeMetadata[ 'presentation' ] | null;
}
