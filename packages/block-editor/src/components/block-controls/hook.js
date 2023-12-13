/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import groups from './groups';
import {
	useBlockEditContext,
	mayDisplayControlsKey,
	mayDisplayParentControlsKey,
} from '../block-edit/context';

export default function useBlockControlsFill( group, shareWithChildBlocks ) {
	const context = useBlockEditContext();
	if ( context[ mayDisplayControlsKey ] ) {
		return groups[ group ]?.Fill;
	}
	if ( context[ mayDisplayParentControlsKey ] && shareWithChildBlocks ) {
		return groups.parent.Fill;
	}
	return null;
}
