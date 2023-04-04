/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const name = 'BlockCardControls';
const { Fill, Slot } = createSlotFill( name );

// Despite this SlotFill component being locked via the private-apis package,
// there's still a chance for it to be abused. Further restricting an allowed
// list of blocks will mitigate that a little further.
const allowList = [ 'core/query' ];

const BlockCardControls = ( { children } ) => <Fill>{ children }</Fill>;
const BlockCardControlsSlot = ( props ) => {
	const blockName = useSelect( ( select ) => {
		const { getSelectedBlock } = select( blockEditorStore );
		return getSelectedBlock()?.name;
	} );
	const fills = useSlotFills( name );

	// Restrict which block's can use this slot.
	if ( ! allowList.includes( blockName ) ) {
		return null;
	}

	const hasFills = fills && fills.length;
	if ( ! hasFills ) {
		return null;
	}

	return <Slot { ...props } bubblesVirtually />;
};

BlockCardControls.slotName = name;
BlockCardControls.Slot = BlockCardControlsSlot;

export default BlockCardControls;
