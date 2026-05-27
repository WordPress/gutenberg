/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { BLOCK_BINDINGS_PANEL_EXCLUDED_BLOCKS } from './excluded-blocks';
import { unlock } from '../../lock-unlock';

/**
 * Computes the Block Bindings sources/fields that are compatible with a given
 * block attribute, plus whether the inline picker should render for it.
 *
 * Single source of truth for the picker gate (spec req 10/11). Consumers are
 * `BlockBindingsAttributeControl` (legacy panel) and `GatedConnectedButton`
 * (inline picker), so the gating logic exists once.
 *
 * The per-source `getBlockBindingsSourceFieldsList` calls run INSIDE
 * `useSelect`: the underlying registry selectors transparently subscribe to
 * any other stores read by each `source.getFieldsList({ select, context })`
 * (typically `core/editor` / `core-data` for post-meta), so sources whose
 * field lists arrive asynchronously trigger a re-render. The returned
 * `fieldsBySource` map preserves the selector's memoized array refs, keeping
 * `useSelect`'s shallow-equal check happy across renders.
 *
 * Filtering and the final shape live in `useMemo` so the per-render filter
 * arrays don't trip the same shallow-equal check inside `useSelect`.
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
	const subscribed = useSelect(
		( select ) => {
			const settings = select( blockEditorStore ).getSettings();
			const { getBlockType } = select( blocksStore );
			const {
				getAllBlockBindingsSources,
				getBlockBindingsSourceFieldsList,
			} = unlock( select( blocksStore ) );

			const fieldsBySource = {};
			Object.entries( getAllBlockBindingsSources() ).forEach(
				( [ sourceName, source ] ) => {
					// `getBlockBindingsSourceFieldsList` is memoized via
					// `createSelector`, so unchanged inputs yield the same
					// array reference across calls.
					const fieldsList = getBlockBindingsSourceFieldsList(
						source,
						blockContext
					);
					if ( fieldsList?.length ) {
						fieldsBySource[ sourceName ] = fieldsList;
					}
				}
			);

			return {
				blockTypeAttribute:
					getBlockType( blockName )?.attributes?.[ attribute ],
				supportedAttributes:
					settings.__experimentalBlockBindingsSupportedAttributes?.[
						blockName
					],
				canUpdateBlockBindings: settings.canUpdateBlockBindings,
				fieldsBySource,
			};
		},
		[ attribute, blockName, blockContext ]
	);

	return useMemo( () => {
		const { blockTypeAttribute, fieldsBySource } = subscribed;

		// Enum-typed attributes have a closed set of values and are
		// therefore not bindable to external sources.
		if ( blockTypeAttribute?.enum ) {
			return { isBindable: false, compatibleFields: {} };
		}

		const attributeType =
			blockTypeAttribute?.type === 'rich-text'
				? 'string'
				: blockTypeAttribute?.type;

		const compatibleFields = {};
		Object.entries( fieldsBySource ).forEach(
			( [ sourceName, fieldsList ] ) => {
				const compatibleFieldsList = fieldsList.filter(
					( field ) => field.type === attributeType
				);
				if ( compatibleFieldsList.length ) {
					compatibleFields[ sourceName ] = compatibleFieldsList;
				}
			}
		);

		const isBindable =
			!! subscribed.canUpdateBlockBindings &&
			!! subscribed.supportedAttributes?.includes( attribute ) &&
			! BLOCK_BINDINGS_PANEL_EXCLUDED_BLOCKS.includes( blockName ) &&
			Object.keys( compatibleFields ).length > 0;

		return { isBindable, compatibleFields };
	}, [ attribute, blockName, subscribed ] );
}
