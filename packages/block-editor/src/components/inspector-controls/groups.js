/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const InspectorControlsDefault = createSlotFill( 'InspectorControls' );
const InspectorControlsAdvanced = createSlotFill( 'InspectorAdvancedControls' );
const InspectorControlsBorder = createSlotFill( 'InspectorControlsBorder' );
const InspectorControlsDimensions = createSlotFill(
	'InspectorControlsDimensions'
);
const InspectorControlsTypography = createSlotFill(
	'InspectorControlsTypography'
);

const groups = {
	default: InspectorControlsDefault,
	advanced: InspectorControlsAdvanced,
	border: InspectorControlsBorder,
	dimensions: InspectorControlsDimensions,
	typography: InspectorControlsTypography,
};

export default groups;
