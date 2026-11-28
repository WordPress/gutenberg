/**
 * Works out which template parts a site uses, and which part in each area is
 * the "primary" one: the part visitors see on the homepage.
 *
 * Everything here is a pure function of the records it is given, so it can be
 * tested without a store and later replaced by a server-side index that
 * returns the same shape.
 */

/**
 * A block as the block editor stores it in an entity's `blocks` edit.
 */
export interface SitePartsBlock {
	name: string;
	attributes?: Record< string, any >;
	innerBlocks?: SitePartsBlock[];
}

/**
 * The content of a template, template part or pattern: either its serialized
 * markup or, when it has unsaved edits, its blocks.
 */
export type SitePartsSource = string | SitePartsBlock[] | undefined;

export interface SitePartsTemplateInput {
	id: string;
	slug: string;
	source: SitePartsSource;
}

export interface SitePartsPartInput {
	id: string;
	area: string;
	source: SitePartsSource;
}

export interface SitePartsPatternInput {
	name: string;
	content?: string;
}

export interface SitePartsUsageInput {
	templates: SitePartsTemplateInput[];
	parts: SitePartsPartInput[];
	patterns?: SitePartsPatternInput[];
	/** The active theme's stylesheet, used for references with no theme. */
	theme: string;
	/** The id of the template the homepage uses, if any. */
	homeTemplateId?: string | null;
}

export interface SitePartUsage {
	area: string;
	/** Ids of the templates that use the part, directly or through nesting. */
	templates: string[];
	/**
	 * Ids of the parts that hold this one: parts that nest it and, for a
	 * navigation overlay, parts whose Navigation block points at it.
	 */
	parents: string[];
}

export interface SitePartsUsage {
	parts: Record< string, SitePartUsage >;
	/** The primary part's id for each area, or `null` when there is none. */
	primary: Record< string, string | null >;
}

type Reference =
	{ type: 'part'; id: string } | { type: 'pattern'; name: string };

const NAVIGATION_OVERLAY_AREA = 'navigation-overlay';

/*
 * Matches the opening or void comment delimiter of the blocks that can point
 * at a template part, in document order. The attributes are matched lazily up
 * to the first `}` that is followed by the end of the delimiter, the way the
 * block parser does.
 */
const REFERENCE_DELIMITER =
	/<!--\s+wp:(?:core\/)?(template-part|pattern|navigation)\s+(\{[\s\S]*?\})\s+\/?-->/g;

/**
 * Turns a template part reference into a `theme//slug` id.
 *
 * @param slug        The part's slug, or an id that already includes the theme.
 * @param theme       The theme the reference names, if any.
 * @param activeTheme The active theme's stylesheet.
 * @return The part id, or `null` when the reference has no slug.
 */
function toPartId(
	slug: unknown,
	theme: unknown,
	activeTheme: string
): string | null {
	if ( typeof slug !== 'string' || ! slug ) {
		return null;
	}
	if ( slug.includes( '//' ) ) {
		return slug;
	}
	return `${ typeof theme === 'string' && theme ? theme : activeTheme }//${ slug }`;
}

/**
 * The template part reference a block makes, if any.
 *
 * @param name        The block name, with or without the `core/` namespace.
 * @param attributes  The block's attributes.
 * @param activeTheme The active theme's stylesheet.
 * @return The reference, or `null` when the block points at nothing.
 */
function getBlockReference(
	name: string,
	attributes: Record< string, any > | undefined,
	activeTheme: string
): Reference | null {
	if ( ! attributes || typeof attributes !== 'object' ) {
		return null;
	}
	const blockName = name.replace( /^core\//, '' );
	if ( blockName === 'template-part' ) {
		const id = toPartId( attributes.slug, attributes.theme, activeTheme );
		return id ? { type: 'part', id } : null;
	}
	if ( blockName === 'navigation' ) {
		// The overlay is either a bare slug or a `theme//slug` id.
		const id = toPartId( attributes.overlay, undefined, activeTheme );
		return id ? { type: 'part', id } : null;
	}
	if ( blockName === 'pattern' && typeof attributes.slug === 'string' ) {
		return { type: 'pattern', name: attributes.slug };
	}
	return null;
}

/**
 * Lists the template part and pattern references in some content, in
 * document order.
 *
 * @param source      Serialized markup or blocks.
 * @param activeTheme The active theme's stylesheet.
 * @return The references.
 */
export function getReferences(
	source: SitePartsSource,
	activeTheme: string
): Reference[] {
	const references: Reference[] = [];
	if ( ! source ) {
		return references;
	}

	if ( Array.isArray( source ) ) {
		const visit = ( blocks: SitePartsBlock[] ) => {
			for ( const block of blocks ) {
				const reference = getBlockReference(
					block.name,
					block.attributes,
					activeTheme
				);
				if ( reference ) {
					references.push( reference );
				}
				if ( block.innerBlocks?.length ) {
					visit( block.innerBlocks );
				}
			}
		};
		visit( source );
		return references;
	}

	for ( const match of source.matchAll( REFERENCE_DELIMITER ) ) {
		let attributes;
		try {
			attributes = JSON.parse( match[ 2 ] );
		} catch {
			continue;
		}
		const reference = getBlockReference(
			match[ 1 ],
			attributes,
			activeTheme
		);
		if ( reference ) {
			references.push( reference );
		}
	}
	return references;
}

/**
 * Whether any of the given content holds a Pattern block, which means
 * registered patterns are needed to finish the scan.
 *
 * @param sources The content of the templates and parts.
 * @return Whether patterns are needed.
 */
export function needsPatterns( sources: SitePartsSource[] ): boolean {
	return sources.some( ( source ) => {
		if ( ! source ) {
			return false;
		}
		if ( typeof source === 'string' ) {
			return /<!--\s+wp:(?:core\/)?pattern\s/.test( source );
		}
		const hasPattern = ( blocks: SitePartsBlock[] ): boolean =>
			blocks.some(
				( block ) =>
					block.name === 'core/pattern' ||
					hasPattern( block.innerBlocks ?? [] )
			);
		return hasPattern( source );
	} );
}

/**
 * Works out which template parts are in use, and the primary part in each
 * area.
 *
 * A part is in use when a template reaches it: through a Template Part block,
 * through another part that nests it, through a Pattern block, or, for a
 * navigation overlay, through a Navigation block's `overlay` attribute.
 *
 * The primary part comes from the homepage template, falling back to the
 * `index` template when the homepage has no part in an area. The first header
 * and last footer win, matching how they appear on the page. The primary
 * navigation overlay is the first one the primary header points at.
 *
 * @param input The templates, parts and patterns to scan.
 * @return The usage of every part, and the primary part in each area.
 */
export function getSitePartsUsageFromRecords(
	input: SitePartsUsageInput
): SitePartsUsage {
	const { templates, parts, patterns = [], theme, homeTemplateId } = input;

	const partsById = new Map( parts.map( ( part ) => [ part.id, part ] ) );
	const patternsByName = new Map(
		patterns.map( ( pattern ) => [ pattern.name, pattern ] )
	);

	const referenceCache = new Map< string, Reference[] >();
	const getCachedReferences = ( key: string, source: SitePartsSource ) => {
		let references = referenceCache.get( key );
		if ( ! references ) {
			references = getReferences( source, theme );
			referenceCache.set( key, references );
		}
		return references;
	};

	/*
	 * Lists the parts some content reaches, in document order, with each
	 * nested part straight after the part that holds it. `onEdge` is told
	 * about each part and the part directly holding it.
	 */
	const collectParts = (
		references: Reference[],
		holder: string | null,
		seenParts: Set< string >,
		seenPatterns: Set< string >,
		ordered: string[],
		onEdge?: ( partId: string, holderId: string | null ) => void
	) => {
		for ( const reference of references ) {
			if ( reference.type === 'pattern' ) {
				const pattern = patternsByName.get( reference.name );
				if ( ! pattern || seenPatterns.has( reference.name ) ) {
					continue;
				}
				seenPatterns.add( reference.name );
				collectParts(
					getCachedReferences(
						`pattern:${ reference.name }`,
						pattern.content
					),
					holder,
					seenParts,
					seenPatterns,
					ordered,
					onEdge
				);
				continue;
			}

			const part = partsById.get( reference.id );
			// Ignore references to parts that don't exist.
			if ( ! part ) {
				continue;
			}
			onEdge?.( part.id, holder );
			// A visited part is not walked again, so a part that ends up
			// including itself cannot loop.
			if ( seenParts.has( part.id ) ) {
				continue;
			}
			seenParts.add( part.id );
			ordered.push( part.id );
			collectParts(
				getCachedReferences( `part:${ part.id }`, part.source ),
				part.id,
				seenParts,
				seenPatterns,
				ordered,
				onEdge
			);
		}
		return ordered;
	};

	const getPartsInTemplate = (
		template: SitePartsTemplateInput,
		onEdge?: ( partId: string, holderId: string | null ) => void
	) =>
		collectParts(
			getCachedReferences( `template:${ template.id }`, template.source ),
			null,
			new Set(),
			new Set(),
			[],
			onEdge
		);

	const usage: Record< string, SitePartUsage > = {};
	for ( const part of parts ) {
		usage[ part.id ] = { area: part.area, templates: [], parents: [] };
	}

	const orderedByTemplate = new Map< string, string[] >();
	for ( const template of templates ) {
		const ordered = getPartsInTemplate( template, ( partId, holderId ) => {
			if (
				holderId &&
				holderId !== partId &&
				! usage[ partId ].parents.includes( holderId )
			) {
				usage[ partId ].parents.push( holderId );
			}
		} );
		orderedByTemplate.set( template.id, ordered );
		for ( const partId of ordered ) {
			usage[ partId ].templates.push( template.id );
		}
	}

	const getOrderedInArea = ( templateId: string | undefined, area: string ) =>
		( templateId
			? ( orderedByTemplate.get( templateId ) ?? [] )
			: []
		).filter( ( partId ) => usage[ partId ].area === area );

	const pickFromTemplate = (
		templateId: string | undefined,
		area: string
	): string | null => {
		const inArea = getOrderedInArea( templateId, area );
		if ( ! inArea.length ) {
			return null;
		}
		return ( area === 'footer' ? inArea.at( -1 ) : inArea[ 0 ] ) ?? null;
	};

	const homeId =
		homeTemplateId && orderedByTemplate.has( homeTemplateId )
			? homeTemplateId
			: undefined;
	const indexId = templates.find(
		( template ) => template.slug === 'index'
	)?.id;

	const areas = new Set( parts.map( ( part ) => part.area ) );
	const primary: Record< string, string | null > = {};
	for ( const area of areas ) {
		if ( area === NAVIGATION_OVERLAY_AREA ) {
			continue;
		}
		primary[ area ] =
			pickFromTemplate( homeId, area ) ??
			pickFromTemplate( indexId, area );
	}

	// The primary overlay is the one the primary header opens. Without a
	// header, fall back to the first overlay the homepage, then the index
	// template, reaches.
	if ( areas.has( NAVIGATION_OVERLAY_AREA ) ) {
		const header = primary.header;
		const fromHeader = header
			? collectParts(
					getCachedReferences(
						`part:${ header }`,
						partsById.get( header )?.source
					),
					header,
					new Set( [ header ] ),
					new Set(),
					[]
				).find(
					( partId ) =>
						usage[ partId ].area === NAVIGATION_OVERLAY_AREA
				)
			: undefined;
		primary[ NAVIGATION_OVERLAY_AREA ] =
			fromHeader ??
			pickFromTemplate( homeId, NAVIGATION_OVERLAY_AREA ) ??
			pickFromTemplate( indexId, NAVIGATION_OVERLAY_AREA );
	}

	return { parts: usage, primary };
}
