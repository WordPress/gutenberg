const DEFAULT_ATTRIBUTE = '__default';
const PATTERN_OVERRIDES_SOURCE = 'core/pattern-overrides';
const SYNCED_STYLES_SOURCE = 'core/synced-styles';

/**
 * Checks if the block has the `__default` binding for pattern overrides.
 *
 * @param {?Record<string, object>} bindings A block's bindings from the metadata attribute.
 *
 * @return {boolean} Whether the block has the `__default` binding for pattern overrides.
 */
export function hasPatternOverridesDefaultBinding( bindings ) {
	return bindings?.[ DEFAULT_ATTRIBUTE ]?.source === PATTERN_OVERRIDES_SOURCE;
}

/**
 * Returns the bindings with the `__default` binding for pattern overrides
 * replaced with the full-set of supported attributes. e.g.:
 *
 * - bindings passed in: `{ __default: { source: 'core/pattern-overrides' } }`
 * - bindings returned: `{ content: { source: 'core/pattern-overrides' } }`
 *
 * @param {?Record<string, object>} bindings            A block's bindings from the metadata attribute.
 * @param {string[]}                supportedAttributes The block's attributes which are supported by block bindings.
 *
 * @return {Object} The bindings with default replaced for pattern overrides.
 */
export function replacePatternOverridesDefaultBinding(
	bindings,
	supportedAttributes
) {
	const defaultBinding = bindings?.[ DEFAULT_ATTRIBUTE ];
	const source = defaultBinding?.source;

	// The `__default` binding works for pattern overrides and synced styles.
	if (
		source !== PATTERN_OVERRIDES_SOURCE &&
		source !== SYNCED_STYLES_SOURCE
	) {
		return bindings;
	}

	const bindingsWithDefaults = {};
	for ( const attributeName of supportedAttributes ) {
		// If the block has mixed binding sources, retain any non-default bindings.
		// Spread defaultBinding to preserve args (e.g. context key for synced styles).
		bindingsWithDefaults[ attributeName ] = bindings[ attributeName ]
			? bindings[ attributeName ]
			: { ...defaultBinding };
	}

	return bindingsWithDefaults;
}
