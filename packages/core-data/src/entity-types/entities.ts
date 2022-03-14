/**
 * Internal dependencies
 */
import type { Context } from './helpers';
import type { CoreEntityConfig } from '../entities';

/**
 * HTTP Query parameters sent with the API request to fetch the entity records.
 */
export type EntityQuery<
	C extends Context,
	Fields extends string[] | undefined = undefined
> = Record< string, any > & {
	context?: C;
	/**
	 * The requested fields. If specified, the REST API will remove from the response
	 * any fields not on that list.
	 */
	_fields?: Fields;
};

/**
 * Helper type that transforms "raw" entity configuration from entities.ts
 * into a format that makes searching by root and kind easy and extensible.
 *
 * This is the foundation of return type inference in calls such as:
 * `getEntityRecord( "root", "comment", 15 )`.
 *
 * @see EntityRecordOf
 * @see getEntityRecord
 */
export type EntityConfigTypeFromConst<
	E extends {
		kind: string;
		name: string;
		baseURLParams?: EntityQuery< any >;
		key?: string;
	},
	R
> = {
	kind: E[ 'kind' ];
	name: E[ 'name' ];
	recordType: R;
	key: E[ 'key' ] extends string ? E[ 'key' ] : 'id';
	defaultContext: E[ 'baseURLParams' ] extends {
		context: infer C;
	}
		? C
		: 'view';
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
	core: CoreEntityConfig< C >;
}

/**
 * A union of all the registered entities.
 */
type EntityConfig<
	C extends Context = any
> = PerPackageEntityConfig< C >[ keyof PerPackageEntityConfig< C > ];

/**
 * A union of all known record types.
 */
export type EntityRecord<
	C extends Context = any
> = EntityConfig< C >[ 'recordType' ];

/**
 * An entity corresponding to a specified record type.
 */
export type EntityConfigOf<
	RecordOrKind extends EntityRecord | Kind,
	N extends Name = undefined
> = RecordOrKind extends EntityRecord
	? Extract< EntityConfig, { recordType: RecordOrKind } >
	: Extract< EntityConfig, { kind: RecordOrKind; name: N } >;

/**
 * Name of the requested entity.
 */
export type NameOf< R extends EntityRecord > = EntityConfigOf< R >[ 'name' ];

/**
 * Kind of the requested entity.
 */
export type KindOf< R extends EntityRecord > = EntityConfigOf< R >[ 'kind' ];

/**
 * Primary key type of the requested entity, sourced from PerPackageEntities.
 *
 * For core entities, the key type is computed using the entity configuration in entities.js.
 */
export type KeyOf<
	RecordOrKind extends EntityRecord | Kind,
	N extends Name = undefined,
	E extends EntityConfig = EntityConfigOf< RecordOrKind, N >
> = E[ 'key' ] extends keyof E[ 'recordType' ]
	? E[ 'recordType' ][ E[ 'key' ] ]
	: never;

/**
 * Default context of the requested entity, sourced from PerPackageEntities.
 *
 * For core entities, the default context is extracted from the entity configuration
 * in entities.js.
 */
export type DefaultContextOf<
	RecordOrKind extends EntityRecord | Kind,
	N extends Name = undefined
> = EntityConfigOf< RecordOrKind, N >[ 'defaultContext' ];

/**
 * An entity record type associated with specified kind and name, sourced from PerPackageEntities.
 */
export type EntityRecordOf<
	K extends Kind,
	N extends Name,
	C extends Context = DefaultContextOf< K, N >
> = Extract< EntityConfig< C >, { kind: K; name: N } >[ 'recordType' ];

/**
 * A union of all known entity kinds.
 */
export type Kind = EntityConfig[ 'kind' ];
/**
 * A union of all known entity names.
 */
export type Name = EntityConfig[ 'name' ];
