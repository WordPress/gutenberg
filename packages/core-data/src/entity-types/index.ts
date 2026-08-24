import type {
	Context,
	OmitNevers,
	PostStatus,
	RenderedText,
	Updatable,
} from './helpers';
import type { Attachment } from './attachment';
import type { Base, TemplatePartArea, TemplateType } from './base';
import type { Comment } from './comment';
import type {
	FontCollection,
	CollectionFontFamily,
	CollectionFontFace,
} from './font-collection';
import type { FontFamily, FontFace, WpFontFamily } from './font-family';
import type { GlobalStyles } from './global-styles';
import type { GlobalStylesRevision } from './global-styles-revision';
import type { Icon } from './icon';
import type { MenuLocation } from './menu-location';
import type { NavMenu } from './nav-menu';
import type { NavMenuItem } from './nav-menu-item';
import type { Page } from './page';
import type { Plugin } from './plugin';
import type { Post } from './post';
import type { PostStatusObject } from './post-status';
import type { PostRevision } from './post-revision';
import type { Settings } from './settings';
import type { Sidebar } from './sidebar';
import type { Taxonomy } from './taxonomy';
import type { Term } from './term';
import type { Theme } from './theme';
import type { User } from './user';
import type { Type } from './type';
import type { Widget } from './widget';
import type { WidgetType } from './widget-type';
import type { WpBlock } from './wp-block';
import type { WpNavigation } from './wp-navigation';
import type { WpTemplate } from './wp-template';
import type { WpTemplatePart } from './wp-template-part';

export type { BaseEntityRecords } from './base-entity-records';

export type {
	Attachment,
	Base as UnstableBase,
	CollectionFontFace,
	CollectionFontFamily,
	Comment,
	Context,
	FontCollection,
	FontFace,
	FontFamily,
	GlobalStyles,
	GlobalStylesRevision,
	Icon,
	MenuLocation,
	NavMenu,
	NavMenuItem,
	OmitNevers,
	Page,
	Plugin,
	Post,
	PostRevision,
	PostStatus,
	PostStatusObject,
	RenderedText,
	Settings,
	Sidebar,
	Taxonomy,
	TemplatePartArea,
	TemplateType,
	Term,
	Theme,
	Type,
	Updatable,
	User,
	Widget,
	WidgetType,
	WpBlock,
	WpFontFamily,
	WpNavigation,
	WpTemplate,
	WpTemplatePart,
};

/**
 * An interface that may be extended to add types for new entities. Each entry
 * must be a union of entity definitions adhering to the EntityInterface type.
 *
 * Example:
 *
 * ```ts
 * import type { Context } from '@wordpress/core-data';
 * // ...
 *
 * interface Client {
 *   id: number;
 *   name: string;
 *   // ...
 * }
 *
 * interface Order< C extends Context > {
 *   id: number;
 *   name: string;
 *   // ...
 * }
 *
 * declare module '@wordpress/core-data' {
 *     export interface PerPackageEntityRecords< C extends Context > {
 *         myPlugin: Client | Order<C>>
 *     }
 * }
 *
 * const c = getEntityRecord<Order>( 'myPlugin', 'order', 15 );
 * // c is of the type Order
 * ```
 */
export interface PerPackageEntityRecords< C extends Context > {
	core:
		| Base< C >
		| Attachment< C >
		| Comment< C >
		| FontCollection< C >
		| GlobalStyles< C >
		| GlobalStylesRevision< C >
		| Icon< C >
		| MenuLocation< C >
		| NavMenu< C >
		| NavMenuItem< C >
		| Page< C >
		| Plugin< C >
		| Post< C >
		| PostStatusObject< C >
		| PostRevision< C >
		| Settings< C >
		| Sidebar< C >
		| Taxonomy< C >
		| Term< C >
		| Theme< C >
		| User< C >
		| Type< C >
		| Widget< C >
		| WidgetType< C >
		| WpFontFamily< C >
		| WpBlock< C >
		| WpNavigation< C >
		| WpTemplate< C >
		| WpTemplatePart< C >;
}

/**
 * A union of all known record types.
 */
export type EntityRecord< C extends Context = 'edit' > =
	PerPackageEntityRecords< C >[ keyof PerPackageEntityRecords< C > ];

/**
 * The names the `root` kind knows about, and the record each one returns.
 *
 * Declared separately from `EntityRecordTypes` so a plugin can merge a name
 * into this kind on its own. Redeclaring `root` on `EntityRecordTypes` itself
 * would fail, because merged interface properties have to have identical
 * types.
 */
export interface RootEntityRecordTypes< C extends Context > {
	__unstableBase: Base< C >;
	comment: Comment< C >;
	fontCollection: FontCollection< C >;
	globalStyles: GlobalStyles< C >;
	icon: Icon< C >;
	media: Attachment< C >;
	menu: NavMenu< C >;
	menuItem: NavMenuItem< C >;
	menuLocation: MenuLocation< C >;
	plugin: Plugin< C >;
	postType: Type< C >;
	sidebar: Sidebar< C >;
	site: Settings< C >;
	status: PostStatusObject< C >;
	taxonomy: Taxonomy< C >;
	theme: Theme< C >;
	user: User< C >;
	widget: Widget< C >;
	widgetType: WidgetType< C >;
}

/**
 * The post types the map knows about, and the record each one returns.
 *
 * A custom post type is added by merging into this interface.
 *
 * @see RootEntityRecordTypes
 */
export interface PostTypeEntityRecordTypes< C extends Context > {
	attachment: Attachment< C >;
	page: Page< C >;
	post: Post< C >;
	wp_block: WpBlock< C >;
	wp_font_family: WpFontFamily< C >;
	wp_navigation: WpNavigation< C >;
	wp_template: WpTemplate< C >;
	wp_template_part: WpTemplatePart< C >;
}

/**
 * The taxonomies the map knows about, and the record each one returns.
 *
 * A custom taxonomy is added by merging into this interface.
 *
 * @see RootEntityRecordTypes
 */
export interface TaxonomyEntityRecordTypes< C extends Context > {
	category: Term< C >;
	post_tag: Term< C >;
}

/**
 * Maps an entity's `kind` and `name` to the record type it returns.
 *
 * `getEntityRecord( 'postType', 'post', 1 )` names the record it wants with
 * two strings. Without this map those strings are just `string`, so the
 * selector can only promise `EntityRecord` — the union of every known record
 * type — and reading a property off the result fails unless that property
 * exists on all of them.
 *
 * The map is intentionally open: entities are registered at runtime, so a
 * `kind`/`name` pair missing here keeps resolving to the union rather than
 * raising an error. Custom post types and plugin entities therefore behave
 * exactly as they did before.
 *
 * A plugin registering a whole new kind merges into this interface, the same
 * way it would extend `PerPackageEntityRecords`:
 *
 * ```ts
 * declare module '@wordpress/core-data' {
 *     export interface EntityRecordTypes< C extends Context > {
 *         myPlugin: { order: Order< C > };
 *     }
 * }
 * ```
 *
 * A plugin adding a name to a kind that already exists merges into that
 * kind's own interface instead:
 *
 * ```ts
 * declare module '@wordpress/core-data' {
 *     export interface PostTypeEntityRecordTypes< C extends Context > {
 *         product: Product< C >;
 *     }
 *     export interface TaxonomyEntityRecordTypes< C extends Context > {
 *         genre: Term< C >;
 *     }
 * }
 * ```
 *
 * @see EntityRecordOf
 */
export interface EntityRecordTypes< C extends Context > {
	root: RootEntityRecordTypes< C >;
	postType: PostTypeEntityRecordTypes< C >;
	taxonomy: TaxonomyEntityRecordTypes< C >;
}

/**
 * The entity kinds the map knows about. Keys do not vary by context, so the
 * lookup is done against a single context.
 */
export type EntityKind = keyof EntityRecordTypes< 'edit' >;

/**
 * The entity names the map knows about for a given kind.
 */
export type EntityNameOf< Kind extends EntityKind > =
	keyof EntityRecordTypes< 'edit' >[ Kind ] & string;

/**
 * Resolves a `kind`/`name` pair to the record type it returns.
 *
 * Only accepts pairs the map knows about. Selectors express the fallback for
 * everything else through overload resolution instead: a pair that fails these
 * constraints matches the original, wider signature, so entities registered at
 * runtime behave exactly as they did before the map existed.
 */
export type EntityRecordOf<
	Kind extends EntityKind,
	Name extends EntityNameOf< Kind >,
	C extends Context = 'edit',
	/*
	 * `Name` is constrained against the `'edit'` map. The keys do not vary by
	 * context, but TypeScript cannot see that, so the lookup is re-narrowed
	 * against the map for the context actually being resolved.
	 */
> = EntityRecordTypes< C >[ Kind ][ Name &
	keyof EntityRecordTypes< C >[ Kind ] ];

/**
 * The contexts a query's `context` property can hold.
 *
 * A literal, or a union of them, is the context the request will use. Anything
 * wider -- `string`, `any`, an optional property -- could still be any of the
 * three at runtime.
 */
type ContextsOf< Requested > = Context extends Requested
	? Context
	: Requested extends Context
	? Requested
	: Context;

/**
 * Resolves the context a query asks for.
 *
 * Only an inline object keeps `context` as a literal: assigning that same
 * object to a variable widens the property to `string` at the declaration,
 * before the call is made. A query with no `context` keeps the default.
 */
type ContextOfQuery< Query > = 'context' extends keyof Query
	? ContextsOf< Query[ 'context' & keyof Query ] >
	: 'edit';

/**
 * Resolves a `kind`/`name` pair to its record in each of the given contexts.
 *
 * `ContextualField` distributes over the contexts a field is available in, not
 * over `C`, so a record instantiated at `'view' | 'edit'` would carry the
 * edit-only fields. Distributing here returns a union of records instead, so
 * only the fields every context serialises can be read.
 */
type EntityRecordInContexts<
	Kind extends EntityKind,
	Name extends EntityNameOf< Kind >,
	C extends Context,
> = C extends Context ? EntityRecordOf< Kind, Name, C > : never;

/**
 * Resolves a `kind`/`name` pair against the query it was requested with.
 *
 * `context` selects which fields the REST API serialises, so a `'view'`
 * request must not be typed with the edit-context fields.
 *
 * `_fields` is deliberately not modelled. Narrowing to the named fields makes
 * the type rigid for what is a small number of call sites, and the useful
 * shape there varies per consumer. Call sites that request a subset and want
 * that reflected should say so locally -- with `Pick`, or their own interface
 * -- rather than have it imposed here.
 */
export type EntityRecordOfQuery<
	Kind extends EntityKind,
	Name extends EntityNameOf< Kind >,
	Query,
> = EntityRecordInContexts< Kind, Name, ContextOfQuery< Query > >;
