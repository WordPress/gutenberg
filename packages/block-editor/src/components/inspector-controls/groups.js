/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const InspectorControlsDefault = createSlotFill( 'InspectorControls' );
const InspectorControlsAdvanced = createSlotFill( 'InspectorAdvancedControls' );
const InspectorControlsBorder = createSlotFill( 'InspectorControlsBorder' );
const InspectorControlsColor = createSlotFill( 'InspectorControlsColor' );
const InspectorControlsMenu = createSlotFill( 'InspectorControlsMenu' );
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
	color: InspectorControlsColor,
	dimensions: InspectorControlsDimensions,
	menu: InspectorControlsMenu,
	typography: InspectorControlsTypography,
};

export default groups;
