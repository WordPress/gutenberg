/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { hasStickyOrFixedPositionValue } from '../../hooks/position';

// `offset` keeps the toolbar 8px ($grid-unit-10) off the block;
// `shift.padding` keeps it the same 8px off the viewport edges when shifting.
const COMMON_PROPS = {
	flip: false,
	offset: 8,
	shift: { padding: 8 },
};

// Default: anchor above the selected block. `shift` keeps it on screen as the
// user scrolls.
const DEFAULT_PROPS = {
	...COMMON_PROPS,
	placement: 'top-start',
};

// Place the toolbar below the block when:
// - It's the first top-level block (no room above and scrolling can't rescue
//   the user since they're already at the canvas top), or
// - The block has sticky/fixed positioning (it can pin to the viewport top
//   where a toolbar above would overlap or get clipped by editor chrome).
const BELOW_BLOCK_PROPS = {
	...COMMON_PROPS,
	placement: 'bottom-start',
};

export default function useBlockToolbarPopoverProps( { clientId } ) {
	const placeBelow = useSelect(
		( select ) => {
			const { getBlockRootClientId, getBlockIndex, getBlockAttributes } =
				select( blockEditorStore );
			const isFirstTopLevelBlock =
				! getBlockRootClientId( clientId ) &&
				getBlockIndex( clientId ) === 0;
			const isSticky = hasStickyOrFixedPositionValue(
				getBlockAttributes( clientId )
			);
			return isFirstTopLevelBlock || isSticky;
		},
		[ clientId ]
	);

	return placeBelow ? BELOW_BLOCK_PROPS : DEFAULT_PROPS;
}
