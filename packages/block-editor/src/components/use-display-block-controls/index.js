/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit/context';
import { store as blockEditorStore } from '../../store';

export default function useDisplayBlockControls() {
	const { isSelected, clientId, name } = useBlockEditContext();
	return useSelect(
		( select ) => {
			if ( isSelected ) {
				return true;
			}

			const {
				getBlockName,
				isFirstMultiSelectedBlock,
				getMultiSelectedBlockClientIds,
			} = select( blockEditorStore );

			if ( isFirstMultiSelectedBlock( clientId ) ) {
				return getMultiSelectedBlockClientIds().every(
					( id ) => getBlockName( id ) === name
				);
			}

			return false;
		},
		[ clientId, isSelected, name ]
	);
}
