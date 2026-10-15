import { createSlotFill } from '@wordpress/components';

const InspectorControlsDefault = createSlotFill( 'InspectorControls' );
const InspectorControlsAdvanced = createSlotFill( 'InspectorAdvancedControls' );
const InspectorControlsBindings = createSlotFill( 'InspectorControlsBindings' );
const InspectorControlsBackground = createSlotFill(
	'InspectorControlsBackground'
);
const InspectorControlsBorder = createSlotFill( 'InspectorControlsBorder' );
const InspectorControlsColor = createSlotFill( 'InspectorControlsColor' );
const InspectorControlsFilter = createSlotFill( 'InspectorControlsFilter' );
const InspectorControlsDimensions = createSlotFill(
	'InspectorControlsDimensions'
);
const InspectorControlsLayout = createSlotFill( 'InspectorControlsLayout' );
const InspectorControlsElements = createSlotFill( 'InspectorControlsElements' );
const InspectorControlsPosition = createSlotFill( 'InspectorControlsPosition' );
const InspectorControlsTypography = createSlotFill(
	'InspectorControlsTypography'
);
const InspectorControlsStyleState = createSlotFill(
	'InspectorControlsStyleState'
);
const InspectorControlsListView = createSlotFill( 'InspectorControlsListView' );
const InspectorControlsStyles = createSlotFill( 'InspectorControlsStyles' );
const InspectorControlsEffects = createSlotFill( 'InspectorControlsEffects' );
const InspectorControlsContent = createSlotFill( 'InspectorControlsContent' );

const groups = {
	default: InspectorControlsDefault,
	advanced: InspectorControlsAdvanced,
	background: InspectorControlsBackground,
	bindings: InspectorControlsBindings,
	border: InspectorControlsBorder,
	color: InspectorControlsColor,
	content: InspectorControlsContent,
	dimensions: InspectorControlsDimensions,
	effects: InspectorControlsEffects,
	elements: InspectorControlsElements,
	filter: InspectorControlsFilter,
	layout: InspectorControlsLayout,
	list: InspectorControlsListView,
	position: InspectorControlsPosition,
	settings: InspectorControlsDefault, // Alias for default.
	styles: InspectorControlsStyles,
	typography: InspectorControlsTypography,
	'style-state': InspectorControlsStyleState,
};

export default groups;

// Private slot for allowed blocks control UI.
export const PrivateInspectorControlsAllowedBlocks = createSlotFill(
	Symbol( 'PrivateInspectorControlsAllowedBlocks' )
);

// Private slot for the "Advanced" panel shown while editing a style state, so
// it always renders after every other style state panel.
export const PrivateInspectorControlsStyleStateAdvanced = createSlotFill(
	Symbol( 'PrivateInspectorControlsStyleStateAdvanced' )
);
