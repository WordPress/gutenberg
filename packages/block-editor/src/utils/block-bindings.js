/**
 * WordPress dependencies
 */
import { useDispatch, useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { useBlockEditContext } from '../components/block-edit';

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
