/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: BlockInserterFill, Slot: BlockInserterSlot } = createSlotFill( 'EditWidgetsInserter' );

const Inserter = BlockInserterFill;

Inserter.Slot = function() {
	return (
		<BlockInserterSlot bubblesVirtually />
	);
};

export default Inserter;
