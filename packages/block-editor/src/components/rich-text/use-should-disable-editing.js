/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { getBlockType, store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { BLOCK_BINDINGS_ALLOWED_BLOCKS } from '../../hooks/use-bindings-attributes';
import { useBlockEditContext } from '../block-edit';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export function useShouldDisableEditing() {
	const { clientId, name: blockName } = useBlockEditContext();

	const { getBlockAttributes } = useSelect( blockEditorStore );
	const { getBlockBindingsSource } = unlock( useSelect( blocksStore ) );
	const blockBindings = getBlockAttributes( clientId )?.metadata?.bindings;

	if ( blockBindings && blockName in BLOCK_BINDINGS_ALLOWED_BLOCKS ) {
		const blockTypeAttributes = getBlockType( blockName ).attributes;

		for ( const [ attribute, args ] of Object.entries( blockBindings ) ) {
			if ( blockTypeAttributes?.[ attribute ]?.source !== 'rich-text' ) {
				break;
			}

			// If the source is not defined, or if its value of `lockAttributesEditing` is `true`, disable it.
			const blockBindingsSource = getBlockBindingsSource( args.source );
			if (
				! blockBindingsSource ||
				blockBindingsSource.lockAttributesEditing
			) {
				return true;
			}
		}
	}

	return false;
}
