/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit/context';
import { store as blockEditorStore } from '../../store';

export default function useDisplayBlockControls( {
	__experimentalExposeToChildren = false,
} = {} ) {
	const { isSelected, clientId, name } = useBlockEditContext();
	const isActive = useSelect(
		( select ) => {
			if ( isSelected ) {
				return true;
			}

			const {
				getBlockName,
				isFirstMultiSelectedBlock,
				getMultiSelectedBlockClientIds,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );

			if ( isFirstMultiSelectedBlock( clientId ) ) {
				return getMultiSelectedBlockClientIds().every(
					( id ) => getBlockName( id ) === name
				);
			}
			if ( __experimentalExposeToChildren ) {
				return hasSelectedInnerBlock( clientId );
			}

			return false;
		},
		[ clientId, isSelected, name ]
	);

	return isActive;
}
