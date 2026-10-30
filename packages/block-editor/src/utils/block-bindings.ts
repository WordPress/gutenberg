import type { BlockBindingsSource as RegisteredSource } from '@wordpress/blocks';
import type { DataRegistry } from '@wordpress/data';
import isURLLike from '../components/link-control/is-url-like';

export type Binding = { source?: string; args?: Record< string, unknown > };
export type Bindings = Record< string, Binding >;
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

/**
 * Selects the values of the block's bound attributes from their sources.
 *
 * @param select             The registry's `select`.
 * @param clientId           The block client ID.
 * @param blockBindings      The block's bindings, with defaults replaced.
 * @param bindableAttributes The attributes the block can bind.
 * @param registeredSources  The registered bindings sources, by name.
 * @param context            The context for resolving the bindings.
 *
 * @return The values by attribute name.
 */
export function selectBoundAttributes(
	select: DataRegistry[ 'select' ],
	clientId: string,
	blockBindings: Bindings,
	bindableAttributes: string[] | undefined,
	registeredSources: Record< string, Omit< RegisteredSource, 'name' > >,
	context: Record< string, unknown >
) {
	const attributesFromSources: Record< string, unknown > = {};
	const blockBindingsBySource = new Map<
		Omit< RegisteredSource, 'name' >,
		Record< string, { args?: Record< string, unknown > } >
	>();

	for ( const [ attributeName, binding ] of Object.entries(
		blockBindings
	) ) {
		const { source: sourceName, args: sourceArgs } = binding;
		// An absent source looks up nothing.
		const source = registeredSources[ sourceName as string ];
		if ( ! source || ! bindableAttributes?.includes( attributeName ) ) {
			continue;
		}

		blockBindingsBySource.set( source, {
			...blockBindingsBySource.get( source ),
			[ attributeName ]: {
				args: sourceArgs,
			},
		} );
	}

	for ( const [ source, bindings ] of blockBindingsBySource ) {
		// Get values in batch if the source supports it.
		let values: Record< string, unknown > = {};
		if ( ! source.getValues ) {
			Object.keys( bindings ).forEach( ( attr ) => {
				// Default to the source label when `getValues` doesn't exist.
				values[ attr ] = source.label;
			} );
		} else {
			values = source.getValues( {
				select,
				context,
				clientId,
				bindings,
			} );
		}
		for ( const [ attributeName, value ] of Object.entries( values ) ) {
			attributesFromSources[ attributeName ] =
				attributeName === 'url' &&
				// Sources return URLs as strings.
				( ! value || ! isURLLike( value as string ) )
					? // Return null if value is not a valid URL.
						null
					: value;
		}
	}

	return attributesFromSources;
}
