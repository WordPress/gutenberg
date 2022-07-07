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
import type { CoreEntities } from '../entities';

export type { EntityType } from './entities';
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

export type UpdatableEntityRecord = Updatable< EntityRecord< 'edit' > >;

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
 * interface Order {
 *   id: number;
 *   clientId: number;
 *   // ...
 * }
 *
 * type OrderEntity = {
 *   kind: 'myPlugin';
 *   name: 'order';
 *   recordType: Order;
 * }
 *
 * declare module '@wordpress/core-data' {
 *     export interface PerPackageEntities< C extends Context > {
 *         myPlugin: OrderEntity | ClientEntity
 *     }
 * }
 *
 * const c = getEntityRecord( 'myPlugin', 'order', 15 );
 * // c is of the type Order
 * ```
 */
export interface PerPackageEntityConfig< C extends Context > {
	core: CoreEntities< C >;
}

/**
 * A union of all the registered entities.
 */
type EntityConfig< C extends Context = any > =
	PerPackageEntityConfig< C >[ keyof PerPackageEntityConfig< C > ];

/**
 * A union of all known record types.
 */
export type EntityRecord< C extends Context = any > =
	EntityConfig< C >[ 'record' ];

/**
 * An entity corresponding to a specified record type.
 */
export type EntityConfigOf<
	RecordOrKind extends EntityRecord | Kind,
	N extends Name | undefined = undefined
> = RecordOrKind extends EntityRecord
	? Extract< EntityConfig, { record: RecordOrKind } >
	: Extract< EntityConfig, { config: { kind: RecordOrKind; name: N } } >;

/**
 * A union of all known entity kinds.
 */
export type Kind = EntityConfig[ 'config' ][ 'kind' ];
/**
 * A union of all known entity names.
 */
export type Name = EntityConfig[ 'config' ][ 'name' ];
