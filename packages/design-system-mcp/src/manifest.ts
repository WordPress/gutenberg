/**
 * Dual-shape Storybook components manifest client.
 *
 * Supports:
 * - Inline manifests (Storybook ≤10.4 / docgen server off): each entry carries
 *   `path`, `reactComponentMeta`, and `stories` directly.
 * - Ref manifests (`experimentalDocgenServer`): the index only has summary
 *   fields plus `$ref` pointers into `services/core/docgen` and
 *   `services/core/story-docs`. Detail payloads are fetched on demand.
 */

export type JsonRef = { $ref: string };

export type ManifestProp = {
	required?: boolean;
	type?: { name: string; raw?: string };
	description?: string;
	defaultValue?: { value: string } | null;
};

export type ManifestStory = {
	name: string;
	snippet?: string;
	description?: string;
};

/**
 * A components.json entry in either shape. Ref manifests omit `path` /
 * `reactComponentMeta` on the index and point at them via `docgen` / `stories`.
 */
export type ManifestEntry = {
	id: string;
	name: string;
	description?: string;
	summary?: string;
	path?: string;
	reactComponentMeta?: {
		description?: string;
		displayName?: string;
		exportName?: string;
		props?: Record< string, ManifestProp >;
	};
	/**
	 * Inline: story array (or map). Ref index: `{ $ref }` into story-docs.
	 */
	stories?: ManifestStory[] | Record< string, ManifestStory > | JsonRef;
	/**
	 * Ref index only: pointer to the docgen payload.
	 */
	docgen?: JsonRef;
};

export type ComponentsManifest = {
	v?: number;
	components: Record< string, ManifestEntry >;
};

/**
 * True when the entry uses a docgen `$ref`.
 *
 * @param entry - A components manifest index entry.
 */
export function isRefManifestEntry(
	entry: ManifestEntry | undefined
): entry is ManifestEntry & { docgen: JsonRef } {
	return typeof entry?.docgen?.$ref === 'string';
}

/**
 * True when any entry in the manifest uses docgen `$ref`s.
 *
 * @param manifest - The components manifest document.
 */
export function isRefManifest( manifest: ComponentsManifest ): boolean {
	return Object.values( manifest.components ).some( isRefManifestEntry );
}

/**
 * Resolve a JSON Pointer (`/components/foo`) against a document.
 *
 * @param document - The JSON document to walk.
 * @param pointer  - A JSON Pointer starting with `/`.
 */
export function resolveJsonPointer(
	document: unknown,
	pointer: string
): unknown {
	if ( ! pointer || pointer === '/' ) {
		return document;
	}
	if ( ! pointer.startsWith( '/' ) ) {
		throw new Error( `Invalid JSON pointer: ${ pointer }` );
	}
	return pointer
		.slice( 1 )
		.split( '/' )
		.map( ( segment ) =>
			segment.replace( /~1/g, '/' ).replace( /~0/g, '~' )
		)
		.reduce( ( current, key ) => {
			if (
				current === null ||
				current === undefined ||
				typeof current !== 'object'
			) {
				return undefined;
			}
			return ( current as Record< string, unknown > )[ key ];
		}, document );
}

/**
 * Turn a `$ref` like `../services/core/docgen/x.json#/components/x` into an
 * absolute URL relative to the manifest URL that contained it.
 *
 * @param manifestUrl - Absolute URL of the components manifest.
 * @param ref         - A relative `$ref` string, optionally with a `#pointer`.
 */
export function resolveRefUrl(
	manifestUrl: string,
	ref: string
): {
	url: string;
	pointer: string;
} {
	const [ filePart, pointer = '' ] = ref.split( '#' );
	return {
		url: new URL( filePart, manifestUrl ).href,
		pointer,
	};
}

async function fetchJson( url: string ): Promise< unknown > {
	const response = await fetch( url );
	if ( ! response.ok ) {
		throw new Error(
			`Failed to fetch ${ url }: ${ response.status } ${ response.statusText }`
		);
	}
	return response.json();
}

/**
 * Fetch a `$ref` target and return the pointed-at payload.
 *
 * @param manifestUrl - Absolute URL of the components manifest.
 * @param ref         - A relative `$ref` string, optionally with a `#pointer`.
 */
export async function fetchRefPayload(
	manifestUrl: string,
	ref: string
): Promise< unknown > {
	const { url, pointer } = resolveRefUrl( manifestUrl, ref );
	const document = await fetchJson( url );
	return resolveJsonPointer( document, pointer );
}

/**
 * Merge an index entry with its docgen + story-docs payloads into the inline
 * shape the rest of the MCP parser expects.
 *
 * @param manifestUrl - Absolute URL of the components manifest.
 * @param entry       - An index entry, possibly with `$ref` fields.
 */
export async function hydrateManifestEntry(
	manifestUrl: string,
	entry: ManifestEntry
): Promise< ManifestEntry > {
	if ( ! isRefManifestEntry( entry ) ) {
		return entry;
	}

	const [ docgen, storyDocs ] = await Promise.all( [
		fetchRefPayload( manifestUrl, entry.docgen.$ref ),
		typeof ( entry.stories as JsonRef | undefined )?.$ref === 'string'
			? fetchRefPayload( manifestUrl, ( entry.stories as JsonRef ).$ref )
			: Promise.resolve( undefined ),
	] );

	const docgenPayload =
		docgen && typeof docgen === 'object' ? ( docgen as ManifestEntry ) : {};
	const storyPayload =
		storyDocs && typeof storyDocs === 'object'
			? ( storyDocs as {
					stories?: ManifestEntry[ 'stories' ];
					import?: unknown;
			  } )
			: {};

	return {
		...entry,
		...docgenPayload,
		id: docgenPayload.id ?? entry.id,
		name: docgenPayload.name ?? entry.name,
		description: docgenPayload.description ?? entry.description,
		stories: storyPayload.stories ?? entry.stories,
		// Drop the index-only ref field so callers treat this as inline.
		docgen: undefined,
	};
}
