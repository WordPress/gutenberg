/**
 * WordPress dependencies
 */
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useCallback, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { store as blocksStore } from '@wordpress/blocks';
import { useBlockEditContext } from '../components/block-edit';
import BlockContext from '../components/block-context';
import isURLLike from '../components/link-control/is-url-like';
import { unlock } from '../lock-unlock';

const DEFAULT_ATTRIBUTE = '__default';
const PATTERN_OVERRIDES_SOURCE = 'core/pattern-overrides';

/**
 * Checks if the given object is empty.
 *
 * @param {?Object} object The object to check.
 *
 * @return {boolean} Whether the object is empty.
 */
function isObjectEmpty( object ) {
	return ! object || Object.keys( object ).length === 0;
}

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
	// The `__default` binding currently only works for pattern overrides.
	if ( hasPatternOverridesDefaultBinding( bindings ) ) {
		const bindingsWithDefaults = {};
		for ( const attributeName of supportedAttributes ) {
			// If the block has mixed binding sources, retain any non pattern override bindings.
			const bindingSource = bindings[ attributeName ]
				? bindings[ attributeName ]
				: { source: PATTERN_OVERRIDES_SOURCE };
			bindingsWithDefaults[ attributeName ] = bindingSource;
		}

		return bindingsWithDefaults;
	}

	return bindings;
}

/**
 * Contains utils to update the block `bindings` metadata.
 *
 * @typedef {Object} WPBlockBindingsUtils
 *
 * @property {Function} updateBlockBindings    Updates the value of the bindings connected to block attributes.
 * @property {Function} removeAllBlockBindings Removes the bindings property of the `metadata` attribute.
 */

/**
 * Retrieves the existing utils needed to update the block `bindings` metadata.
 * They can be used to create, modify, or remove connections from the existing block attributes.
 *
 * It contains the following utils:
 * - `updateBlockBindings`: Updates the value of the bindings connected to block attributes. It can be used to remove a specific binding by setting the value to `undefined`.
 * - `removeAllBlockBindings`: Removes the bindings property of the `metadata` attribute.
 *
 * @since 6.7.0 Introduced in WordPress core.
 *
 * @param {?string} clientId Optional block client ID. If not set, it will use the current block client ID from the context.
 *
 * @return {?WPBlockBindingsUtils} Object containing the block bindings utils.
 *
 * @example
 * ```js
 * import { useBlockBindingsUtils } from '@wordpress/block-editor'
 * const { updateBlockBindings, removeAllBlockBindings } = useBlockBindingsUtils();
 *
 * // Update url and alt attributes.
 * updateBlockBindings( {
 *     url: {
 *         source: 'core/post-meta',
 *         args: {
 *             key: 'url_custom_field',
 *         },
 *     },
 *     alt: {
 *         source: 'core/post-meta',
 *         args: {
 *             key: 'text_custom_field',
 *         },
 *     },
 * } );
 *
 * // Remove binding from url attribute.
 * updateBlockBindings( { url: undefined } );
 *
 * // Remove bindings from all attributes.
 * removeAllBlockBindings();
 * ```
 */
export function useBlockBindingsUtils( clientId ) {
	const { clientId: contextClientId } = useBlockEditContext();
	const blockClientId = clientId || contextClientId;
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { getBlockAttributes } = useRegistry().select( blockEditorStore );

	/**
	 * Updates the value of the bindings connected to block attributes.
	 * It removes the binding when the new value is `undefined`.
	 *
	 * @param {Object} bindings        Bindings including the attributes to update and the new object.
	 * @param {string} bindings.source The source name to connect to.
	 * @param {Object} [bindings.args] Object containing the arguments needed by the source.
	 *
	 * @example
	 * ```js
	 * import { useBlockBindingsUtils } from '@wordpress/block-editor'
	 *
	 * const { updateBlockBindings } = useBlockBindingsUtils();
	 * updateBlockBindings( {
	 *     url: {
	 *         source: 'core/post-meta',
	 *         args: {
	 *             key: 'url_custom_field',
	 *         },
	 * 	   },
	 *     alt: {
	 *         source: 'core/post-meta',
	 *         args: {
	 *             key: 'text_custom_field',
	 *         },
	 * 	   }
	 * } );
	 * ```
	 */
	const updateBlockBindings = ( bindings ) => {
		const { metadata: { bindings: currentBindings, ...metadata } = {} } =
			getBlockAttributes( blockClientId );
		const newBindings = { ...currentBindings };

		Object.entries( bindings ).forEach( ( [ attribute, binding ] ) => {
			if ( ! binding && newBindings[ attribute ] ) {
				delete newBindings[ attribute ];
				return;
			}
			newBindings[ attribute ] = binding;
		} );

		const newMetadata = {
			...metadata,
			bindings: newBindings,
		};

		if ( isObjectEmpty( newMetadata.bindings ) ) {
			delete newMetadata.bindings;
		}

		updateBlockAttributes( blockClientId, {
			metadata: isObjectEmpty( newMetadata ) ? undefined : newMetadata,
		} );
	};

	/**
	 * Removes the bindings property of the `metadata` attribute.
	 *
	 * @example
	 * ```js
	 * import { useBlockBindingsUtils } from '@wordpress/block-editor'
	 *
	 * const { removeAllBlockBindings } = useBlockBindingsUtils();
	 * removeAllBlockBindings();
	 * ```
	 */
	const removeAllBlockBindings = () => {
		const { metadata: { bindings, ...metadata } = {} } =
			getBlockAttributes( blockClientId );
		updateBlockAttributes( blockClientId, {
			metadata: isObjectEmpty( metadata ) ? undefined : metadata,
		} );
	};

	return { updateBlockBindings, removeAllBlockBindings };
}

/**
 * Default value used for blocks which do not define their own context needs,
 * used to guarantee that a block's `context` prop will always be an object.
 *
 * @type {{}}
 */
const DEFAULT_BLOCK_CONTEXT = {};

/**
 * Hook that provides computed block attributes with values from block bindings sources.
 * This hook replicates the logic from EditWithGeneratedProps.computedAttributes
 * to enable block bindings support in components that need to read bound attribute values.
 *
 * @param {string} clientId The block client ID.
 *
 * @return {Object} Computed attributes with values from block bindings sources.
 */
export function useBlockBindingsComputedAttributes( clientId ) {
	const blockContext = useContext( BlockContext );

	const { attributes, blockType, bindableAttributes, registeredSources } =
		useSelect(
			( select ) => {
				const { getBlockAttributes, getBlockName } =
					select( blockEditorStore );
				const { getBlockType } = select( blocksStore );
				const { __experimentalBlockBindingsSupportedAttributes } =
					select( blockEditorStore ).getSettings();

				const blockName = getBlockName( clientId );
				const blockAttributes = getBlockAttributes( clientId );

				return {
					attributes: blockAttributes,
					blockType: getBlockType( blockName ),
					bindableAttributes:
						__experimentalBlockBindingsSupportedAttributes?.[
							blockName
						],
					registeredSources: unlock(
						select( blocksStore )
					).getAllBlockBindingsSources(),
				};
			},
			[ clientId ]
		);

	const { blockBindings, context } = useMemo( () => {
		// Assign context values using the block type's declared context needs.
		const computedContext = blockType?.usesContext
			? Object.fromEntries(
					Object.entries( blockContext ).filter( ( [ key ] ) =>
						blockType.usesContext.includes( key )
					)
			  )
			: DEFAULT_BLOCK_CONTEXT;
		// Add context requested by Block Bindings sources.
		if ( attributes?.metadata?.bindings ) {
			Object.values( attributes?.metadata?.bindings || {} ).forEach(
				( binding ) => {
					registeredSources[ binding?.source ]?.usesContext?.forEach(
						( key ) => {
							computedContext[ key ] = blockContext[ key ];
						}
					);
				}
			);
		}
		return {
			blockBindings: replacePatternOverridesDefaultBinding(
				attributes?.metadata?.bindings,
				bindableAttributes
			),
			context: computedContext,
		};
	}, [
		blockType?.usesContext,
		blockContext,
		attributes?.metadata?.bindings,
		registeredSources,
		bindableAttributes,
	] );

	const computedAttributes = useSelect(
		( select ) => {
			if ( ! blockBindings ) {
				return attributes;
			}

			const attributesFromSources = {};
			const blockBindingsBySource = new Map();

			for ( const [ attributeName, binding ] of Object.entries(
				blockBindings
			) ) {
				const { source: sourceName, args: sourceArgs } = binding;
				const source = registeredSources[ sourceName ];
				if (
					! source ||
					! bindableAttributes?.includes( attributeName )
				) {
					continue;
				}

				blockBindingsBySource.set( source, {
					...blockBindingsBySource.get( source ),
					[ attributeName ]: {
						args: sourceArgs,
					},
				} );
			}

			if ( blockBindingsBySource.size ) {
				for ( const [ source, bindings ] of blockBindingsBySource ) {
					// Get values in batch if the source supports it.
					let values = {};
					if ( ! source.getValues ) {
						Object.keys( bindings ).forEach( ( attr ) => {
							// Default to the the source label when `getValues` doesn't exist.
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
					for ( const [ attributeName, value ] of Object.entries(
						values
					) ) {
						if (
							attributeName === 'url' &&
							( ! value || ! isURLLike( value ) )
						) {
							// Return null if value is not a valid URL.
							attributesFromSources[ attributeName ] = null;
						} else {
							attributesFromSources[ attributeName ] = value;
						}
					}
				}
			}

			return {
				...attributes,
				...attributesFromSources,
			};
		},
		[
			attributes,
			bindableAttributes,
			blockBindings,
			clientId,
			context,
			registeredSources,
		]
	);

	return computedAttributes;
}

/**
 * Hook that provides a block bindings-aware setAttributes function.
 * This hook replicates the logic from EditWithGeneratedProps.setBoundAttributes
 * to enable block bindings support in components that don't have access to
 * the wrapped setAttributes prop.
 *
 * @param {string} clientId The block client ID.
 *
 * @return {Function} A function that updates block attributes with block bindings support.
 */
export function useBlockBindingsAwareSetAttributes( clientId ) {
	const registry = useRegistry();
	const blockContext = useContext( BlockContext );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const { attributes, blockType, bindableAttributes, registeredSources } =
		useSelect(
			( select ) => {
				const { getBlockAttributes, getBlockName } =
					select( blockEditorStore );
				const { getBlockType } = select( blocksStore );
				const { __experimentalBlockBindingsSupportedAttributes } =
					select( blockEditorStore ).getSettings();

				const blockName = getBlockName( clientId );
				const blockAttributes = getBlockAttributes( clientId );

				return {
					attributes: blockAttributes,
					blockType: getBlockType( blockName ),
					bindableAttributes:
						__experimentalBlockBindingsSupportedAttributes?.[
							blockName
						],
					registeredSources: unlock(
						select( blocksStore )
					).getAllBlockBindingsSources(),
				};
			},
			[ clientId ]
		);

	const { blockBindings, context, hasPatternOverrides } = useMemo( () => {
		// Assign context values using the block type's declared context needs.
		const computedContext = blockType?.usesContext
			? Object.fromEntries(
					Object.entries( blockContext ).filter( ( [ key ] ) =>
						blockType.usesContext.includes( key )
					)
			  )
			: DEFAULT_BLOCK_CONTEXT;
		// Add context requested by Block Bindings sources.
		if ( attributes?.metadata?.bindings ) {
			Object.values( attributes?.metadata?.bindings || {} ).forEach(
				( binding ) => {
					registeredSources[ binding?.source ]?.usesContext?.forEach(
						( key ) => {
							computedContext[ key ] = blockContext[ key ];
						}
					);
				}
			);
		}
		return {
			blockBindings: replacePatternOverridesDefaultBinding(
				attributes?.metadata?.bindings,
				bindableAttributes
			),
			context: computedContext,
			hasPatternOverrides: hasPatternOverridesDefaultBinding(
				attributes?.metadata?.bindings
			),
		};
	}, [
		blockType?.usesContext,
		blockContext,
		attributes?.metadata?.bindings,
		registeredSources,
		bindableAttributes,
	] );

	const setAttributes = useCallback(
		( nextAttributes ) => {
			if ( ! blockBindings ) {
				updateBlockAttributes( clientId, nextAttributes );
				return;
			}

			registry.batch( () => {
				const keptAttributes = { ...nextAttributes };
				const blockBindingsBySource = new Map();

				// Loop only over the updated attributes to avoid modifying the bound ones that haven't changed.
				for ( const [ attributeName, newValue ] of Object.entries(
					keptAttributes
				) ) {
					if (
						! blockBindings[ attributeName ] ||
						! bindableAttributes?.includes( attributeName )
					) {
						continue;
					}

					const binding = blockBindings[ attributeName ];
					const source = registeredSources[ binding?.source ];
					if ( ! source?.setValues ) {
						continue;
					}
					blockBindingsBySource.set( source, {
						...blockBindingsBySource.get( source ),
						[ attributeName ]: {
							args: binding.args,
							newValue,
						},
					} );
					delete keptAttributes[ attributeName ];
				}

				if ( blockBindingsBySource.size ) {
					// Mark changes as persistent for pattern overrides so they get saved.
					// Check if any of the bindings being updated are pattern overrides.
					const hasPatternOverrideBindings = Array.from(
						blockBindingsBySource.keys()
					).some(
						( source ) => source.name === PATTERN_OVERRIDES_SOURCE
					);
					if ( hasPatternOverrideBindings ) {
						registry
							.dispatch( blockEditorStore )
							.__unstableMarkLastChangeAsPersistent();
					}

					for ( const [
						source,
						bindings,
					] of blockBindingsBySource ) {
						source.setValues( {
							select: registry.select,
							dispatch: registry.dispatch,
							context,
							clientId,
							bindings,
						} );
					}
				}

				const hasParentPattern = !! context[ 'pattern/overrides' ];

				if (
					// Don't update non-connected attributes if the block is using pattern overrides
					// and the editing is happening while overriding the pattern (not editing the original).
					! ( hasPatternOverrides && hasParentPattern ) &&
					Object.keys( keptAttributes ).length
				) {
					// Don't update caption and href until they are supported.
					if ( hasPatternOverrides ) {
						delete keptAttributes.caption;
						delete keptAttributes.href;
					}
					updateBlockAttributes( clientId, keptAttributes );
				}
			} );
		},
		[
			bindableAttributes,
			blockBindings,
			clientId,
			context,
			hasPatternOverrides,
			updateBlockAttributes,
			registeredSources,
			registry,
		]
	);

	return setAttributes;
}
