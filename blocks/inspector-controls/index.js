/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifEditBlockSelected } from '../block-edit/context';

const Fill = createSlotFill( 'InspectorControls' );
const Slot = Fill.Slot;
const InspectorControls = ifEditBlockSelected( Fill );
InspectorControls.Slot = Slot;

export default InspectorControls;
