/**
 * WordPress dependencies
 */
import { createConstrainedSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot, Provider } = createConstrainedSlotFill();

const InspectorControls = ifBlockEditSelected( Fill );
InspectorControls.Slot = Slot;
InspectorControls.Provider = Provider;

export default InspectorControls;
