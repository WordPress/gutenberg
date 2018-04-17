/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const Fill = createSlotFill( 'InspectorAdvancedControls' );
const { Slot } = Fill;

const InspectorAdvancedControls = ifBlockEditSelected( Fill );

InspectorAdvancedControls.Slot = Slot;

export default InspectorAdvancedControls;
