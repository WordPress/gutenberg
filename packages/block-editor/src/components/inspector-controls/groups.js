/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const InspectorControlsDefault = createSlotFill( 'InspectorControls' );
const InspectorControlsAdvanced = createSlotFill( 'InspectorAdvancedControls' );
const InspectorControlsParent = createSlotFill( 'InspectorControlsParent' );

const groups = {
	default: InspectorControlsDefault,
	advanced: InspectorControlsAdvanced,
	parent: InspectorControlsParent,
};

export default groups;
