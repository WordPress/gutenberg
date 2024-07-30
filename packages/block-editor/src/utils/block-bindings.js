/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { useBlockEditContext } from '../components/block-edit';

export function useBlockBindingsUtils() {
	const { clientId } = useBlockEditContext();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	// TODO: Review if this is correct.
	const { getBlockAttributes } = useSelect( blockEditorStore );

	// TODO: Add docs.
	const updateBlockBindings = ( bindings ) => {
		const { metadata } = getBlockAttributes( clientId );
		const newBindings = { ...metadata?.bindings };
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

		if ( Object.keys( newMetadata.bindings ).length === 0 ) {
			delete newMetadata.bindings;
		}

		updateBlockAttributes( clientId, {
			metadata:
				Object.keys( newMetadata ).length === 0
					? undefined
					: newMetadata,
		} );
	};
	// TODO: Add docs.
	const removeAllBlockBindings = () => {
		const { metadata } = getBlockAttributes( clientId );
		const newMetadata = { ...metadata };
		delete newMetadata.bindings;
		updateBlockAttributes( clientId, {
			metadata:
				Object.keys( newMetadata ).length === 0
					? undefined
					: newMetadata,
		} );
	};

	return { updateBlockBindings, removeAllBlockBindings };
}
