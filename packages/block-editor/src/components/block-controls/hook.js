/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import groups from './groups';
import { store as blockEditorStore } from '../../store';
import { useBlockEditContext } from '../block-edit/context';
import useDisplayBlockControls from '../use-display-block-controls';

export default function useBlockControlsFill( group, exposeToChildren ) {
	const isDisplayed = useDisplayBlockControls();
	const { clientId } = useBlockEditContext();
	const isParentDisplayed = useSelect(
		( select ) => {
			return (
				exposeToChildren &&
				select( blockEditorStore ).hasSelectedInnerBlock( clientId )
			);
		},
		[ exposeToChildren, clientId ]
	);

	if ( isDisplayed ) {
		return groups[ group ]?.Fill;
	}
	if ( isParentDisplayed ) {
		return groups.parent.Fill;
	}
	return null;
}
