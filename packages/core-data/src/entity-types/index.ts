import type {
	Context,
	ContextualField,
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
import type { GlobalStyles, GlobalStylesUpdate } from './global-styles';
import type { GlobalStylesRevision } from './global-styles-revision';
import type { Icon } from './icon';
import type { IconCollection } from './icon-collection';
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
import type { Block } from './block';
import type { Navigation } from './navigation';
import type { WpTemplate } from './wp-template';
import type { WpTemplatePart } from './wp-template-part';

export type { BaseEntityRecords } from './base-entity-records';

export type {
	Attachment,
	Base as UnstableBase,
	Block,
	CollectionFontFace,
	CollectionFontFamily,
	Comment,
	Context,
	ContextualField,
	FontCollection,
	FontFace,
	FontFamily,
	GlobalStyles,
	GlobalStylesUpdate,
	GlobalStylesRevision,
	Icon,
	IconCollection,
	MenuLocation,
	NavMenu,
	NavMenuItem,
	Navigation,
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
	WpFontFamily,
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
		| IconCollection< C >
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
		| Block< C >
		| Navigation< C >
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
	globalStyles: GlobalStyles< C >;
	icon: Icon< C >;
	iconCollection: IconCollection< C >;
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
	wp_block: Block< C >;
	wp_navigation: Navigation< C >;
}

/**
 * The taxonomies the map knows about, and the record each one returns.
 *
 * A custom taxonomy is added by merging into this interface.
 *
 * @see RootEntityRecordTypes
 */
export interface TaxonomyEntityRecordTypes<
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	C extends Context,
> {}

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
 * The context a `root` entity is fetched in when the call names none.
 *
 * Mirrors the `baseURLParams` each entity is registered with in
 * `entities.js`. An entity registered without a `context` sends no such
 * parameter, so the REST API applies its own default of `view`.
 *
 * @see EntityContextDefaults
 */
export interface RootEntityContexts {
	globalStyles: 'edit';
	icon: 'view';
	iconCollection: 'view';
}

/**
 * The context a post type is fetched in when the call names none.
 *
 * `loadPostTypeEntities` registers every post type with `context: 'edit'`.
 *
 * @see EntityContextDefaults
 */
export interface PostTypeEntityContexts {
	attachment: 'edit';
	page: 'edit';
	post: 'edit';
	wp_block: 'edit';
	wp_navigation: 'edit';
}

/**
 * The context a taxonomy is fetched in when the call names none.
 *
 * `loadTaxonomyEntities` registers every taxonomy with `context: 'edit'`.
 *
 * @see EntityContextDefaults
 */
export interface TaxonomyEntityContexts {}

/**
 * Maps a `kind`/`name` pair to the context it is fetched in when the call
 * names none.
 *
 * A call passes no `context` far more often than it passes one, so the type it
 * gets back in that case is decided here rather than assumed. `addEntities()`
 * takes a `baseURLParams`, and an entity registered with `context: 'view'`
 * serialises the view fields however the call is written -- typing those
 * results as `edit` would offer fields the response does not carry.
 *
 * A pair with no entry resolves to every context, so the fields common to all
 * three stay readable and the edit-only ones do not. A plugin narrows that by
 * merging its own pairs in, the same way it extends `EntityRecordTypes`.
 *
 * @see DefaultContextOf
 */
export interface EntityContextDefaults {
	root: RootEntityContexts;
	postType: PostTypeEntityContexts;
	taxonomy: TaxonomyEntityContexts;
}

/**
 * The context a `kind`/`name` pair is fetched in when the call names none.
 *
 * Falls back to every context for a pair the map does not cover, which is the
 * conservative answer: the entity is registered at runtime, so its
 * `baseURLParams` are not knowable here.
 */
export type DefaultContextOf<
	Kind extends EntityKind,
	Name extends EntityNameOf< Kind >,
> = Kind extends keyof EntityContextDefaults
	? Name extends keyof EntityContextDefaults[ Kind ]
		? EntityContextDefaults[ Kind ][ Name ] extends Context
			? EntityContextDefaults[ Kind ][ Name ]
			: Context
		: Context
	: Context;

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
 * before the call is made. A query with no `context` falls back to `Default`,
 * the context the entity is registered to be fetched in.
 *
 * Each member of a union query is resolved on its own, because `keyof` over a
 * union is the intersection of its keys -- a `{ context: 'view' } | { per_page:
 * number }` query would otherwise look like it carries no `context` at all and
 * fall back to the default.
 */
type ContextOfQuery< Query, Default extends Context > = Query extends unknown
	? 'context' extends keyof Query
		? ContextsOf< Query[ 'context' & keyof Query ] >
		: Default
	: never;

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
 * `_fields` can omit any field, including nested fields. The exact selection
 * is not inferred from the query, but a request that includes `_fields`
 * returns a recursively partial record so omitted data cannot be read as if
 * it were present.
 */
export type EntityRecordOfQuery<
	Kind extends EntityKind,
	Name extends EntityNameOf< Kind >,
	Query,
> = Query extends unknown
	? '_fields' extends keyof Query
		? DeepPartial<
				EntityRecordInContexts<
					Kind,
					Name,
					ContextOfQuery< Query, DefaultContextOf< Kind, Name > >
				>
		  >
		: EntityRecordInContexts<
				Kind,
				Name,
				ContextOfQuery< Query, DefaultContextOf< Kind, Name > >
		  >
	: never;

/**
 * Makes projected object fields optional. Arrays stay intact because the
 * runtime `_fields` projection treats them as terminal values rather than
 * projecting fields within each element.
 */
type DeepPartial< T > = T extends readonly unknown[]
	? T
	: T extends object
	? { [ K in keyof T ]?: DeepPartial< T[ K ] > }
	: T;
