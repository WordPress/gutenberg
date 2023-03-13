/**
 * Internal dependencies
 */
import type { Context, Updatable } from './helpers';
import type { Attachment } from './attachment';
import type { Comment } from './comment';
import type { MenuLocation } from './menu-location';
import type { NavMenu } from './nav-menu';
import type { NavMenuItem } from './nav-menu-item';
import type { Page } from './page';
import type { Plugin } from './plugin';
import type { Post } from './post';
import type { Settings } from './settings';
import type { Sidebar } from './sidebar';
import type { Taxonomy } from './taxonomy';
import type { Theme } from './theme';
import type { User } from './user';
import type { Type } from './type';
import type { Widget } from './widget';
import type { WidgetType } from './widget-type';
import type { WpTemplate } from './wp-template';
import type { WpTemplatePart } from './wp-template-part';

export type { BaseEntityRecords } from './base-entity-records';

export type {
	Attachment,
	Comment,
	Context,
	MenuLocation,
	NavMenu,
	NavMenuItem,
	Page,
	Plugin,
	Post,
	Settings,
	Sidebar,
	Taxonomy,
	Theme,
	Updatable,
	User,
	Type,
	Widget,
	WidgetType,
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
		| Attachment< C >
		| Comment< C >
		| MenuLocation< C >
		| NavMenu< C >
		| NavMenuItem< C >
		| Page< C >
		| Plugin< C >
		| Post< C >
		| Settings< C >
		| Sidebar< C >
		| Taxonomy< C >
		| Theme< C >
		| User< C >
		| Type< C >
		| Widget< C >
		| WidgetType< C >
		| WpTemplate< C >
		| WpTemplatePart< C >;
}

/**
 * A union of all known record types.
 */
export type EntityRecord< C extends Context = 'edit' > =
	PerPackageEntityRecords< C >[ keyof PerPackageEntityRecords< C > ];
