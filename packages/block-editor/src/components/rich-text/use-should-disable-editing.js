/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BLOCK_BINDINGS_ALLOWED_BLOCKS } from '../../hooks/use-bindings-attributes';
import { useBlockEditContext } from '../block-edit';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export function useShouldDisableEditing( attributeName ) {
	const { clientId, name: blockName } = useBlockEditContext();
	return useSelect(
		( select ) => {
			if (
				! attributeName ||
				! BLOCK_BINDINGS_ALLOWED_BLOCKS[ blockName ]?.includes(
					attributeName
				)
			) {
				return false;
			}
			const blockBindings =
				select( blockEditorStore ).getBlockAttributes( clientId )
					?.metadata?.bindings;
			if ( ! blockBindings?.[ attributeName ]?.source ) {
				return false;
			}
			const blockBindingsSource = unlock(
				select( blocksStore )
			).getBlockBindingsSource( blockBindings[ attributeName ].source );
			return blockBindingsSource?.lockAttributesEditing !== false;
		},
		[ clientId, blockName, attributeName ]
	);
}
