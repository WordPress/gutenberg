/**
 * Internal dependencies
 */
import type { Context } from './helpers';

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
