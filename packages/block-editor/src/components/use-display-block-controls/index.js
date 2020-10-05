/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit/context';

export default function useDisplayBlockControls() {
	const { isSelected, clientId, name } = useBlockEditContext();
	const isFirstAndSameTypeMultiSelected = useSelect(
		( select ) => {
			// Don't bother checking, see OR statement below.
			if ( isSelected ) {
				return;
			}

			const {
				getBlockName,
				isFirstMultiSelectedBlock,
				getMultiSelectedBlockClientIds,
			} = select( 'core/block-editor' );

			if ( ! isFirstMultiSelectedBlock( clientId ) ) {
				return false;
			}

			return getMultiSelectedBlockClientIds().every(
				( id ) => getBlockName( id ) === name
			);
		},
		[ clientId, isSelected, name ]
	);

	return isSelected || isFirstAndSameTypeMultiSelected;
}
