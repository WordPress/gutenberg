import { useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { useBlockEditContext } from '../block-edit';
import type { Binding } from '../../utils/block-bindings';
import type { BlockBindingsUtils } from './types';
import type { BlockAttributes } from '../../store/types';

/**
 * Checks if the given object is empty.
 *
 * @param object The object to check.
 *
 * @return Whether the object is empty.
 */
function isObjectEmpty( object: object | null | undefined ): boolean {
	return ! object || Object.keys( object ).length === 0;
}

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
 * @return {?BlockBindingsUtils} Object containing the block bindings utils.
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
export default function useBlockBindingsUtils(
	clientId?: string | null
): BlockBindingsUtils {
	const { clientId: contextClientId } = useBlockEditContext();
	const blockClientId = clientId || contextClientId;
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { getBlockAttributes } = useRegistry().select( blockEditorStore );

	/**
	 * Updates the value of the bindings connected to block attributes.
	 * It removes the binding when the new value is `undefined`.
	 *
	 * @param bindings        Bindings including the attributes to update and the new object.
	 * @param bindings.source The source name to connect to.
	 * @param bindings.args   Object containing the arguments needed by the source.
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
	const updateBlockBindings = (
		bindings: Record< string, Binding | undefined >
	) => {
		const { metadata: { bindings: currentBindings, ...metadata } = {} } =
			// The utils are used within a block or for a given one.
			getBlockAttributes( blockClientId! ) as BlockAttributes;
		const newBindings: Record< string, Binding | undefined > = {
			...currentBindings,
		};

		Object.entries( bindings ).forEach( ( [ attribute, binding ] ) => {
			if ( ! binding && newBindings[ attribute ] ) {
				delete newBindings[ attribute ];
				return;
			}
			newBindings[ attribute ] = binding;
		} );

		const newMetadata: {
			bindings?: Record< string, Binding | undefined >;
			[ key: string ]: unknown;
		} = {
			...metadata,
			bindings: newBindings,
		};

		if ( isObjectEmpty( newMetadata.bindings ) ) {
			delete newMetadata.bindings;
		}

		updateBlockAttributes( blockClientId!, {
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
			// The utils are used within a block or for a given one.
			getBlockAttributes( blockClientId! ) as BlockAttributes;
		updateBlockAttributes( blockClientId!, {
			metadata: isObjectEmpty( metadata ) ? undefined : metadata,
		} );
	};

	return { updateBlockBindings, removeAllBlockBindings };
}
