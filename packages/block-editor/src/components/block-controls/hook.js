/**
 * Internal dependencies
 */
import groups from './groups';
import { useBlockEditContext } from '../block-edit/context';

export default function useBlockControlsFill( group, shareWithChildBlocks ) {
	const { shouldDisplayControls, shouldDisplayControlsWithinChildren } =
		useBlockEditContext();

	if ( shouldDisplayControls ) {
		return groups[ group ]?.Fill;
	}
	if ( shareWithChildBlocks && shouldDisplayControlsWithinChildren ) {
		return groups.parent.Fill;
	}
	return null;
}
