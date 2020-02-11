/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const name = 'InspectorAdvancedControls';
const { Fill, Slot } = createSlotFill( name );

const InspectorAdvancedControls = ifBlockEditSelected( Fill );

InspectorAdvancedControls.slotName = name;
InspectorAdvancedControls.Slot = Slot;

export default InspectorAdvancedControls;
