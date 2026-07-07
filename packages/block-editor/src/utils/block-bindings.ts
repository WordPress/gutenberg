type Binding = { source?: string };
type Bindings = Record< string, Binding >;

const DEFAULT_ATTRIBUTE = '__default';
const PATTERN_OVERRIDES_SOURCE = 'core/pattern-overrides';

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
