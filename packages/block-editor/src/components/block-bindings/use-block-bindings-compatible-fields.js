/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect, useRegistry } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { BLOCK_BINDINGS_PANEL_EXCLUDED_BLOCKS } from '../../hooks/block-bindings';
import { unlock } from '../../lock-unlock';

/**
 * Computes the Block Bindings sources/fields that are compatible with a given
 * block attribute, plus whether the inline picker should render for it.
 *
 * This is the single source of truth for the picker gate (spec req 10/11):
 * - Reads `getBlockType` from the PUBLIC blocks store selector (spec req 9).
 * - Reads `getAllBlockBindingsSources` / `getBlockBindingsSourceFieldsList`
 *   via the already-unlocked private selectors (no new unlock surfaces — spec
 *   §6).
 * - Honors the `enum` short-circuit and the `rich-text` -> `string` coercion
 *   from `BlockBindingsAttributeControl`.
 * - Folds in all four gates from spec req 11 (a-d) into `isBindable`.
 *
 * Consumers: `BlockBindingsAttributeControl` (legacy panel) and the new
 * `GatedConnectedButton` (inline picker), so the gating logic exists once.
 *
 * @param {string} attribute    The block attribute name (e.g. 'content').
 * @param {string} blockName    The block name (e.g. 'core/paragraph').
 * @param {Object} blockContext The block context object (from `BlockContext`).
 *
 * @return {{ isBindable: boolean, compatibleFields: Object }} Gate predicate
 *   plus map of `sourceKey -> Field[]` (filtered to compatible fields only).
 */
export default function useBlockBindingsCompatibleFields(
	attribute,
	blockName,
	blockContext
) {
	const registry = useRegistry();

	// Subscribe to a small set of stable primitives so `useSelect`'s dev
	// reference-stability check stays happy. The actual compatible-fields
	// computation runs inside `useMemo` below (it would otherwise build a
	// fresh object on every render, tripping `useSelect`'s warning).
	const {
		blockTypeAttribute,
		sources,
		supportedAttributes,
		canUpdateBlockBindings,
	} = useSelect(
		( select ) => {
			const settings = select( blockEditorStore ).getSettings();
			const { getBlockType } = select( blocksStore );
			const { getAllBlockBindingsSources } = unlock(
				select( blocksStore )
			);
			return {
				blockTypeAttribute:
					getBlockType( blockName )?.attributes?.[ attribute ],
				sources: getAllBlockBindingsSources(),
				supportedAttributes:
					settings.__experimentalBlockBindingsSupportedAttributes?.[
						blockName
					],
				canUpdateBlockBindings: settings.canUpdateBlockBindings,
			};
		},
		[ attribute, blockName ]
	);

	return useMemo( () => {
		// Enum-typed attributes have a closed set of values and are therefore
		// not bindable to external sources.
		if ( blockTypeAttribute?.enum ) {
			return { isBindable: false, compatibleFields: {} };
		}

		const attributeType =
			blockTypeAttribute?.type === 'rich-text'
				? 'string'
				: blockTypeAttribute?.type;

		const { getBlockBindingsSourceFieldsList } = unlock(
			registry.select( blocksStore )
		);

		const compatibleFields = {};
		Object.entries( sources ).forEach( ( [ sourceName, source ] ) => {
			const fieldsList = getBlockBindingsSourceFieldsList(
				source,
				blockContext
			);
			if ( ! fieldsList?.length ) {
				return;
			}
			const compatibleFieldsList = fieldsList.filter(
				( field ) => field.type === attributeType
			);
			if ( compatibleFieldsList.length ) {
				compatibleFields[ sourceName ] = compatibleFieldsList;
			}
		} );

		const isBindable =
			!! canUpdateBlockBindings &&
			!! supportedAttributes?.includes( attribute ) &&
			! BLOCK_BINDINGS_PANEL_EXCLUDED_BLOCKS.includes( blockName ) &&
			Object.keys( compatibleFields ).length > 0;

		return { isBindable, compatibleFields };
	}, [
		attribute,
		blockName,
		blockTypeAttribute,
		sources,
		blockContext,
		supportedAttributes,
		canUpdateBlockBindings,
		registry,
	] );
}
