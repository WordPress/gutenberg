/**
 * Internal dependencies
 */
import groups from './groups';
import { useBlockEditContext } from '../block-edit/context';
import useDisplayBlockControls from '../use-display-block-controls';

export default function useBlockControlsFill( group, shareWithChildBlocks ) {
	const isDisplayed = useDisplayBlockControls();
	const { shouldDisplayControls } = useBlockEditContext();
	const isParentDisplayed = shareWithChildBlocks && shouldDisplayControls;

	if ( isDisplayed ) {
		return groups[ group ]?.Fill;
	}
	if ( isParentDisplayed ) {
		return groups.parent.Fill;
	}
	return null;
}
