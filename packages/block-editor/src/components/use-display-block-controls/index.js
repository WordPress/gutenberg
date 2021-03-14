/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockClientId } from '../block-edit';
import { store as blockEditorStore } from '../../store';

export default function useDisplayBlockControls() {
	const clientId = useBlockClientId();
	return useSelect(
		( select ) => {
			const {
				isBlockSelected,
				getBlockName,
				isFirstMultiSelectedBlock,
				getMultiSelectedBlockClientIds,
			} = select( blockEditorStore );

			if ( isBlockSelected( clientId ) ) {
				return true;
			}

			if ( ! isFirstMultiSelectedBlock( clientId ) ) {
				return false;
			}

			const name = getBlockName( clientId );

			return getMultiSelectedBlockClientIds().every(
				( id ) => getBlockName( id ) === name
			);
		},
		[ clientId ]
	);
}
