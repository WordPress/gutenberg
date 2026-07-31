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

/**
 * Internal dependencies
 */
import type { ResolvableField } from './field-types';

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
 * A link in a widget's help note.
 */
export interface WidgetHelpLink {
	/**
	 * Link label. Translatable.
	 */
	label: string;

	/**
	 * Link destination.
	 */
	href: string;
}

/**
 * Declarative contextual help for a widget type, meant for compact
 * surfaces such as tooltips.
 */
export interface WidgetHelp {
	/**
	 * The note. Translatable. May carry `<em>`/`<strong>`; links belong
	 * in `links`.
	 */
	content: string;

	/**
	 * Links contextual to the note.
	 */
	links?: WidgetHelpLink[];
}

/**
 * How relevant an attribute is. Hosts may promote `'high'` to a prominent
 * surface; `'low'` (the default) is not. The widget declares importance,
 * not a surface.
 */
type WidgetAttributeRelevance = 'high' | 'low';

/**
 * A user-triggerable verb a widget type declares. The declaration is
 * serializable data: an envelope (`id`, `label`) plus exactly one
 * fulfillment, named by the key carrying it. Today the only key is `href`,
 * so the only fulfillment is a link.
 *
 * The host owns what follows: which primitive materializes the fulfillment,
 * and where the affordance is placed. For a link that means mounting a real
 * link primitive wherever the surface allows one, so middle-click, copy
 * address, and the anchor role survive.
 */
export interface WidgetAction {
	/**
	 * Stable identifier, local to the widget type.
	 */
	id: string;

	/**
	 * Human-readable label naming the action. Translatable.
	 */
	label: string;

	/**
	 * Link fulfillment: the destination. A URL, an admin path, or a
	 * widget-local file.
	 */
	href: string;

	/**
	 * Link only. When set, the destination downloads instead of navigating.
	 * A string supplies the suggested filename.
	 */
	download?: string | boolean;

	/**
	 * Link only. Whether the destination opens in a new browser tab.
	 */
	openInNewTab?: boolean;
}

/**
 * A DataViews `Field` plus the widget-layer `relevance` hint; what hosts
 * read. Its `type` may also reference a registered field type by name
 * (see `registerFieldType`); `useWidgetTypes` resolves such references
 * into plain `Field` props.
 */
type WidgetAttribute< Item = unknown > = ResolvableField< Item > & {
	relevance?: WidgetAttributeRelevance;
};

/**
 * Authoring helper: a `WidgetAttribute` with `id` narrowed to the widget's
 * attribute keys (`Item`).
 */
export type WidgetAttributeField< Item > = WidgetAttribute< Item > & {
	// `& string` drops number/symbol keys; `Field.id` is a string.
	id: keyof Item & string;
};

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
	 * Human-readable title that names the widget type. Translatable.
	 */
	title: string;

	/**
	 * Human-readable description of what the widget type does.
	 * Translatable.
	 */
	description?: string;

	/**
	 * Contextual help note for compact surfaces.
	 */
	help?: WidgetHelp;

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
	 * - `'framed'` (default when absent): the host paints a header from
	 *   identity and pads the content area.
	 * - `'content-bleed'`: the host's chrome stays visible while the
	 *   content fills the content area edge-to-edge, with no padding.
	 * - `'full-bleed'`: the widget renders edge-to-edge with no
	 *   surrounding chrome.
	 */
	presentation?: 'framed' | 'content-bleed' | 'full-bleed';

	/**
	 * Alternative terms used to match the widget type when searching,
	 * e.g. `calendar` for an events widget. Translatable.
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
	 * via `DataForm`, with no per-widget form wiring. Entries may carry
	 * a `relevance` hint.
	 */
	attributes?: WidgetAttribute< Item >[];

	/**
	 * Declarative actions the widget type exposes. Hosts materialize each
	 * one as an affordance and decide where to place it.
	 */
	actions?: WidgetAction[];

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
 * The `WidgetTypeMetadata` subset a record may carry, resolved server-side
 * (already translated) and overriding the metadata module's values. Every
 * field is optional and nullable; `null`/absent means the module's value
 * stands.
 */
type WidgetModuleRecordOverrides = {
	[ K in keyof Pick<
		WidgetTypeMetadata,
		| 'title'
		| 'description'
		| 'help'
		| 'category'
		| 'presentation'
		| 'keywords'
		| 'actions'
	> ]?: WidgetTypeMetadata[ K ] | null;
};

/**
 * Per-widget record a host feeds to `useWidgetTypes`, in snake_case wire
 * format. The host fetches these however it likes; only the field shape is
 * part of the contract.
 */
export interface WidgetModuleRecord extends WidgetModuleRecordOverrides {
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
}
