/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const InspectorControlsDefault = createSlotFill( 'InspectorControls' );
const InspectorControlsBlock = createSlotFill( 'InspectorControlsBlock' );
const InspectorControlsAdvanced = createSlotFill( 'InspectorAdvancedControls' );

const groups = {
	default: InspectorControlsDefault,
	block: InspectorControlsBlock,
	advanced: InspectorControlsAdvanced,
};

export default groups;
