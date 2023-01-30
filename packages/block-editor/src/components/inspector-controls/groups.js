/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const InspectorControlsDefault = createSlotFill( 'InspectorControls' );
const InspectorControlsAdvanced = createSlotFill( 'InspectorAdvancedControls' );
const InspectorControlsBorder = createSlotFill( 'InspectorControlsBorder' );
const InspectorControlsColor = createSlotFill( 'InspectorControlsColor' );
const InspectorControlsDimensions = createSlotFill(
	'InspectorControlsDimensions'
);
const InspectorControlsPosition = createSlotFill( 'InspectorControlsPosition' );
const InspectorControlsTypography = createSlotFill(
	'InspectorControlsTypography'
);
const InspectorControlsListView = createSlotFill( 'InspectorControlsListView' );
const InspectorControlsStyles = createSlotFill( 'InspectorControlsStyles' );

const groups = {
	default: InspectorControlsDefault,
	advanced: InspectorControlsAdvanced,
	border: InspectorControlsBorder,
	color: InspectorControlsColor,
	dimensions: InspectorControlsDimensions,
	list: InspectorControlsListView,
	settings: InspectorControlsDefault, // Alias for default.
	styles: InspectorControlsStyles,
	typography: InspectorControlsTypography,
	position: InspectorControlsPosition,
};

export default groups;
