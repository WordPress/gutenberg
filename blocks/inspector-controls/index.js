/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const Fill = createSlotFill( 'InspectorControls' );
const { Slot } = Fill;

const InspectorControls = ifBlockEditSelected( Fill );

InspectorControls.Slot = Slot;

export default InspectorControls;
