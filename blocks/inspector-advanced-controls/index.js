/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifEditBlockSelected } from '../block-edit/context';

const Fill = createSlotFill( 'InspectorAdvancedControls' );
const { Slot } = Fill;

const InspectorAdvancedControls = ifEditBlockSelected( Fill );

InspectorAdvancedControls.Slot = Slot;

export default InspectorAdvancedControls;
