/**
 * Internal dependencies
 */
import type { Context } from './helpers';
import { EntityRecord } from './index';

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

interface Edit {}

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
export type EntityType<
	Config extends Pick< EntityConfig< Record, Ctx >, RequiredConfigKeys >,
	Record extends EntityRecord< Ctx >,
	Ctx extends Context
> = {
	record: Record;
	config: Omit< EntityConfig< Record, Ctx >, RequiredConfigKeys > & Config;
	key: Config[ 'key' ] extends string ? Config[ 'key' ] : 'id';
	defaultContext: Config[ 'baseURLParams' ] extends {
		context: infer InferredContext;
	}
		? InferredContext
		: 'view';
};

type RequiredConfigKeys = 'name' | 'kind' | 'key' | 'baseURLParams';

interface EntityConfig< R extends EntityRecord< C >, C extends Context > {
	/** Path in WP REST API from which to request records of this entity. */
	baseURL: string;

	/** Arguments to supply by default to API requests for records of this entity. */
	baseURLParams?: EntityQuery< Context >;

	/**
	 * Returns the title for a given record of this entity.
	 *
	 * Some entities have an associated title, such as the name of a
	 * particular template part ("full width") or of a menu ("main nav").
	 */
	getTitle?: ( record: R ) => string;

	/**
	 * Indicates an alternate field in record that can be used for identification.
	 *
	 * e.g. a post has an id but may also be uniquely identified by its `slug`
	 */
	key?: string;

	/**
	 * Collection in which to classify records of this entity.
	 *
	 * 'root' is a special name given to the core entities provided by the editor.
	 *
	 * It may be the case that we request an entity record for which we have no
	 * valid config in memory. In these cases the editor will look for a loader
	 * function to requests more entity configs from the server for the given
	 * "kind." This is how WordPress defers loading of template entity configs.
	 */
	kind: string;

	/** Translated form of human-recognizable name or reference to records of this entity. */
	label: string;

	mergedEdits?: {
		meta?: boolean;
	};

	/** Name given to records of this entity, e.g. 'media', 'postType', 'widget' */
	name: string;

	/**
	 * Manually provided plural form of the entity name.
	 *
	 * When not supplied the editor will attempt to auto-generate a plural form.
	 */
	plural?: string;

	/**
	 * Fields in record of this entity which may appear as a compound object with
	 * a source value (`raw`) as well as a processed value (`rendered`).
	 *
	 * e.g. a post's `content` in the edit context contains the raw value stored
	 *      in the database as well as the rendered version with shortcodes replaced,
	 *      content texturized, blocks transformed, etc…
	 */
	rawAttributes?: ( keyof R )[];

	/**
	 * Which transient edit operations records of this entity support.
	 */
	transientEdits?: {
		blocks?: boolean;
		selection?: boolean;
	};

	// Unstable properties

	/** Returns additional changes before applying edits to a record of this entity. */
	__unstablePrePersist?: ( record: R, edits: Edit[] ) => Edit[];

	/** Used in `canEdit()` */
	__unstable_rest_base?: string;
}
