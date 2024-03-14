/**
 * WordPress dependencies
 */
import { __experimentalUseSlotFills as useSlotFills } from '@wordpress/components';

/**
 * Internal dependencies
 */
import groups from './groups';

/**
 * We only care about the "other" slot here.
 * This check is specifically for allowing the Replace
 * <MediaReplaceFlow /> on featured images and images
 * within content locked areas.
 * https://github.com/WordPress/gutenberg/pull/53410
 *
 * TODO: Remove this hook, as having a toolbar with only a Replace button is a
 * misuse of the toolbar.
 */
export function useHasAnyBlockControls() {
	const Slot = groups.other?.Slot;
	const fills = useSlotFills( Slot?.__unstableName );
	if ( ! Slot ) {
		return false;
	}
	return !! fills?.length;
}
