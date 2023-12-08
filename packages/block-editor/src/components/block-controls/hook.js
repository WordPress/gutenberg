/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import groups from './groups';
import { useBlockEditContext } from '../block-edit/context';

export default function useBlockControlsFill( group, shareWithChildBlocks ) {
	const { mayDisplayControls, mayDisplayParentControls } =
		useBlockEditContext();
	if ( mayDisplayControls ) {
		return groups[ group ]?.Fill;
	}
	if ( mayDisplayParentControls && shareWithChildBlocks ) {
		return groups.parent.Fill;
	}
	return null;
}
