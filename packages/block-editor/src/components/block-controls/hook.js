/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import groups from './groups';
import useDisplayBlockControls from '../use-display-block-controls';

export default function useBlockControlsFill( group, shareWithChildBlocks ) {
	const { isDisplayed, isParentDisplayed } = useDisplayBlockControls();
	if ( isDisplayed ) {
		return groups[ group ]?.Fill;
	}
	if ( isParentDisplayed && shareWithChildBlocks ) {
		return groups.parent.Fill;
	}
	return null;
}
