export type Binding = { source?: string; args?: Record< string, unknown > };
export type Bindings = Record< string, Binding >;
type BlockBindingsSource = { usesContext?: readonly string[] };

const DEFAULT_ATTRIBUTE = '__default';
const PATTERN_OVERRIDES_SOURCE = 'core/pattern-overrides';
const EMPTY_CONTEXT: Record< string, unknown > = {};

/**
 * The reserved binding key that binds a block's inner blocks, rather than an
 * attribute, to a source. Its value is serialized block markup: a string
 * replaces the block's inner blocks, `''` empties them, and anything else
 * falls back to the block's own inner blocks.
 */
export const INNER_BLOCKS_BINDING_KEY = 'innerBlocks';

/**
 * Sources whose values are attribute values, which can't bind inner blocks.
 */
const SOURCES_WITHOUT_INNER_BLOCKS = [
	'core/post-meta',
	'core/post-data',
	'core/term-data',
];

/**
 * Returns a block's inner blocks binding, if a source can bind them.
 *
 * @param bindings A block's bindings from the metadata attribute.
 *
 * @return The inner blocks binding.
 */
export function getInnerBlocksBinding(
	bindings: Bindings | undefined | null
): Binding | undefined {
	const binding = bindings?.[ INNER_BLOCKS_BINDING_KEY ];
	if (
		typeof binding?.source !== 'string' ||
		SOURCES_WITHOUT_INNER_BLOCKS.includes( binding.source )
	) {
		return undefined;
	}
	return binding;
}

/**
 * Returns whether a source value for inner blocks is one: either `''`, or
 * serialized block markup.
 *
 * @param value The source value.
 *
 * @return Whether the value replaces the block's own inner blocks.
 */
export function isInnerBlocksBindingValue( value: unknown ): value is string {
	return (
		typeof value === 'string' &&
		( value === '' || /^[ \t\n\f\r]*<!-- wp:/.test( value ) )
	);
}

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
	for ( const attributeName of supportedAttributes ?? [] ) {
		// Inner blocks are only bound explicitly.
		if ( attributeName === INNER_BLOCKS_BINDING_KEY ) {
			continue;
		}
		// If the block has mixed binding sources, retain any non pattern override bindings.
		const bindingSource = bindings[ attributeName ]
			? bindings[ attributeName ]
			: { source: PATTERN_OVERRIDES_SOURCE };
		bindingsWithDefaults[ attributeName ] = bindingSource;
	}

	return bindingsWithDefaults;
}
