import { __experimentalUseSlotFills as useSlotFills } from '@wordpress/components';
import groups from './groups';

/**
 * Whether one of the block controls groups has anything filled into it, and so
 * whether its slot has anything to show.
 *
 * @param group The group's name.
 *
 * @return Whether the group has fills.
 */
export default function useHasBlockControls( group: string ): boolean {
	const fills = useSlotFills( groups[ group ]?.name );
	return !! fills?.length;
}
