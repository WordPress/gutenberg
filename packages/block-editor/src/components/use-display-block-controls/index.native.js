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
	return useSelect( () => {
		if ( isSelected ) {
			return true;
		}

		return false;
	}, [ clientId, isSelected, name ] );
}
