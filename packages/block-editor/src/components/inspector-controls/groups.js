/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const InspectorControlsDefault = createSlotFill( 'InspectorControls' );
const InspectorControlsAdvanced = createSlotFill( 'InspectorAdvancedControls' );

const groups = {
	default: InspectorControlsDefault,
	advanced: InspectorControlsAdvanced,
};

export default groups;
