type Binding = { source?: string };
type Bindings = Record< string, Binding >;
type BlockBindingsSource = { usesContext?: readonly string[] };

const DEFAULT_ATTRIBUTE = '__default';
const PATTERN_OVERRIDES_SOURCE = 'core/pattern-overrides';
const EMPTY_CONTEXT: Record< string, unknown > = {};

/**
 * Assembles the context made available to a block's bindings sources: the
 * entries of the surrounding block context declared by the block type's
 * `usesContext`, plus the entries declared by the given sources' `usesContext`.
 *
 * Only entries present in the surrounding block context are copied — a
 * declared key with no provider never becomes an own (undefined-valued) key
 * of the result, so `key in context` checks stay meaningful.
 *
 * @param blockContext         The surrounding block context.
 * @param blockTypeUsesContext The block type's declared context needs.
 * @param sources              Block-bindings sources whose declared context to add.
 *
 * @return The context for resolving the block's bindings.
 */
export function getBlockBindingsContext(
	blockContext: Record< string, unknown >,
	blockTypeUsesContext: readonly string[] | undefined,
	sources: readonly ( BlockBindingsSource | undefined )[] | undefined
): Record< string, unknown > {
	let context: Record< string, unknown > | undefined;
	if ( blockTypeUsesContext ) {
		for ( const [ key, value ] of Object.entries( blockContext ) ) {
			if ( blockTypeUsesContext.includes( key ) ) {
				if ( context === undefined ) {
					context = {};
				}
				context[ key ] = value;
			}
		}
	}
	if ( sources ) {
		for ( const source of sources ) {
			source?.usesContext?.forEach( ( key ) => {
				if ( key in blockContext ) {
					if ( context === undefined ) {
						context = {};
					}
					context[ key ] = blockContext[ key ];
				}
			} );
		}
	}
	// A stable empty object avoids re-renders for consumers that compare the
	// context by reference.
	return context ?? EMPTY_CONTEXT;
}

/**
 * Checks if the block has the `__default` binding for pattern overrides.
 *
 * @param bindings A block's bindings from the metadata attribute.
 *
 * @return Whether the block has the `__default` binding for pattern overrides.
 */
export function hasPatternOverridesDefaultBinding(
	bindings: Bindings | undefined | null
): bindings is Bindings {
	return bindings?.[ DEFAULT_ATTRIBUTE ]?.source === PATTERN_OVERRIDES_SOURCE;
}

/**
 * Returns the bindings with the `__default` binding for pattern overrides
 * replaced with the full-set of supported attributes. e.g.:
 *
 * - bindings passed in: `{ __default: { source: 'core/pattern-overrides' } }`
 * - bindings returned: `{ content: { source: 'core/pattern-overrides' } }`
 *
 * @param bindings            A block's bindings from the metadata attribute.
 * @param supportedAttributes The block's attributes which are supported by block bindings.
 *
 * @return The bindings with default replaced for pattern overrides.
 */
export function replacePatternOverridesDefaultBinding(
	bindings: Bindings | undefined | null,
	supportedAttributes: string[]
) {
	// The `__default` binding currently only works for pattern overrides.
	if ( ! hasPatternOverridesDefaultBinding( bindings ) ) {
		return bindings;
	}

	const bindingsWithDefaults: Bindings = {};
	for ( const attributeName of supportedAttributes ) {
		// If the block has mixed binding sources, retain any non pattern override bindings.
		const bindingSource = bindings[ attributeName ]
			? bindings[ attributeName ]
			: { source: PATTERN_OVERRIDES_SOURCE };
		bindingsWithDefaults[ attributeName ] = bindingSource;
	}

	return bindingsWithDefaults;
}
