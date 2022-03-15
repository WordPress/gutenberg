export type Context = 'edit' | 'embed' | 'view';

interface Edit {}

// @ts-ignore
export interface EntityRecord< C extends Context > {}

export interface EntityConfig< Record extends EntityRecord<any> > {
	/** Path in WP REST API from which to request records of this entity. */
	baseURL: string;

	/** Arguments to supply by default to API requests for records of this entity. */
	baseURLParams: { context: Context };

	/**
	 * Returns the title for a given record of this entity.
	 *
	 * Some entities have an associated title, such as the name of a
	 * particular template part ("full width") or of a menu ("main nav").
	 */
	getTitle( record: Record ): string;

	/**
	 * Indicates an alternate field in record that can be used for identification.
	 *
	 * e.g. a post has an id but may also be uniquely identified by its `slug`
	 */
	key: string;

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

	/** @TODO: What is this? */
	mergedEdits: {
		meta?: boolean;
	}

	/** Name given to records of this entity, e.g. 'media', 'postType', 'widget' */
	name: string;

	/**
	 * Manually provided plural form of the entity name.
	 *
	 * When not supplied the editor will attempt to auto-generate a plural form.
	 */
	plural: string;

	/**
	 * Fields in record of this entity which may appear as a compound object with
	 * a source value (`raw`) as well as a processed value (`rendered`).
	 *
	 * e.g. a post's `content` in the edit context contains the raw value stored
	 *      in the database as well as the rendered version with shortcodes replaced,
	 *      content texturized, blocks transformed, etc…
	 */
	rawAttributes: (keyof Record)[];

	/**
	 * Which transient edit operations records of this entity support.
	 */
	transientEdits: {
		blocks?: boolean;
		selection?: boolean;
	}

	// Unstable properties

	/** Returns additional changes before applying edits to a record of this entity. */
	__unstablePrePersist( record: Record, edits: Edit[] ): Edit[];

	/** @TODO: What is this? Used in `canEdit()` */
	__unstable_rest_base: string;
}
