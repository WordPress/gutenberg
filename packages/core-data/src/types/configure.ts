/**
 * Internal dependencies
 */
import type { Context, CoreEntityRecord } from './';
import * as RecordTypes from './';

import { defaultEntities } from '../entities';

// Model the configuration entry
interface EntityConfig {
	label: string;
	kind: string;
	name: string;
	baseURL: string;
	plural?: string;
	key?: string;
	baseURLParams?: EntityQuery< Context >;
	getTitle?: (
		record: CoreEntityRecord< 'edit' > | null
	) => string | undefined;
	rawAttributes?: readonly string[];
	transientEdits?: {
		blocks: boolean;
	};
}

export type EntityQuery< C extends Context > = {
	[ key: string ]: string;
	context?: C;
};

// <workaround>
// This implements asConst + type checking with EntityConfig interface. This is needed to
// use Extract< typeof defaultEntities, { kind: K; name: N } >.
// Inspired by the following SO answer:
// https://stackoverflow.com/questions/57069802/as-const-is-ignored-when-there-is-a-type-definition
type WithLiterals< T, L, LTuple > = T extends
	| string
	| number
	| boolean
	| null
	| undefined
	? T & L
	: {
			[ P in keyof T ]: WithLiterals< T[ P ], L, LTuple > &
				( T[ P ] extends Array< any > ? LTuple : unknown );
	  };

export function entitiesConfig<
	LTuple extends [ unknown ] | unknown[],
	L extends string | boolean | number,
	T extends WithLiterals< EntityConfig[], L, LTuple >
>( o: T ): T extends Array< infer C > ? C : never {
	return o as any;
}
// </workaround>

// Build the CoreEntity type using the data from entity config when possible:
type DeclaredEntity<
	K extends string,
	N extends string,
	RecordType,
	E extends EntityConfig = Extract<
		typeof defaultEntities,
		{ kind: K; name: N }
	>,
	PrimaryKeyField = E[ 'key' ] extends undefined ? 'id' : E[ 'key' ]
> = {
	kind: K;
	name: N;
	recordType: RecordType;
	keyType: PrimaryKeyField extends keyof RecordType
		? RecordType[ PrimaryKeyField ]
		: never;
	defaultContext: E[ 'baseURLParams' ][ 'context' ] extends Context
		? E[ 'baseURLParams' ][ 'context' ]
		: 'view';
};

type APIEntity<
	K extends string,
	N extends string,
	RecordType,
	KeyName = 'id',
	C = 'edit'
> = {
	kind: K;
	name: N;
	recordType: RecordType;
	keyType: KeyName extends keyof RecordType ? RecordType[ KeyName ] : number;
	defaultContext: C;
};

type CoreEntity< C extends Context = any > =
	| DeclaredEntity< 'root', 'comment', RecordTypes.Comment< C > >
	| DeclaredEntity< 'root', 'site', RecordTypes.Settings< C > >
	| DeclaredEntity< 'root', 'widget', RecordTypes.Widget< C > >
	| DeclaredEntity< 'root', 'postType', RecordTypes.Type< C > >
	| DeclaredEntity< 'root', 'media', RecordTypes.Attachment< C > >
	| DeclaredEntity< 'root', 'taxonomy', RecordTypes.Taxonomy< C > >
	| DeclaredEntity< 'root', 'sidebar', RecordTypes.Sidebar< C > >
	| DeclaredEntity< 'root', 'widgetType', RecordTypes.WidgetType< C > >
	| DeclaredEntity< 'root', 'user', RecordTypes.User< C > >
	| DeclaredEntity< 'root', 'menu', RecordTypes.NavMenu< C > >
	| DeclaredEntity< 'root', 'menuItem', RecordTypes.NavMenuItem< C > >
	| DeclaredEntity< 'root', 'menuLocation', RecordTypes.MenuLocation< C > >
	| DeclaredEntity<
			'root',
			'navigationArea',
			RecordTypes.NavigationArea< C >
	  >
	| DeclaredEntity< 'root', 'theme', RecordTypes.Theme< C > >
	| DeclaredEntity< 'root', 'plugin', RecordTypes.Plugin< C > >
	| APIEntity< 'postType', 'post', RecordTypes.Post< C > >
	| APIEntity< 'postType', 'page', RecordTypes.Page< C > >
	| APIEntity< 'postType', 'wp_template', RecordTypes.WpTemplate< C > >
	| APIEntity<
			'postType',
			'wp_template_part',
			RecordTypes.WpTemplatePart< C >
	  >;

// Enable adding new entity types via interface merging
export interface PerPackageEntity< C extends Context > {
	core: CoreEntity< C >;
}

export type Entity<
	C extends Context = any
> = PerPackageEntity< C >[ keyof PerPackageEntity< C > ];

// Utility types for building function signatures

export type Kind = Entity[ 'kind' ];
export type Name = Entity[ 'name' ];
export type EntityRecord<
	C extends Context = any
> = Entity< C >[ 'recordType' ];

export type RecordOf< K, N, C extends Context = any > = Extract<
	Entity< C >,
	{ kind: K; name: N }
>[ 'recordType' ];

export type KindOf< R extends EntityRecord > = Extract<
	Entity,
	{ recordType: R }
>[ 'kind' ];

export type NameOf< R extends EntityRecord > = Extract<
	Entity,
	{ recordType: R }
>[ 'name' ];

export type KeyOf< R extends EntityRecord > = Extract<
	Entity,
	{ recordType: R }
>[ 'keyType' ];

export type DefaultContextOf< R extends EntityRecord > = Extract<
	Entity,
	{ recordType: R }
>[ 'defaultContext' ];
