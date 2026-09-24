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
const InspectorControlsViewport = createSlotFill( 'InspectorControlsViewport' );
const InspectorControlsListView = createSlotFill( 'InspectorControlsListView' );
const InspectorControlsStyles = createSlotFill( 'InspectorControlsStyles' );
const InspectorControlsEffects = createSlotFill( 'InspectorControlsEffects' );
const InspectorControlsContent = createSlotFill( 'InspectorControlsContent' );

const coreGroups = {
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
	viewport: InspectorControlsViewport,
};

/**
 * A Slot/Fill pair exists for every core group ahead of time, but a custom
 * group registered via `registerInspectorTab()` (see
 * `components/inspector-controls-tabs`) can use any group name. This proxy
 * lazily creates (and caches) a Slot/Fill pair the first time an unknown
 * group name is looked up, so `groups[name]` keeps working exactly as
 * before at every existing call site for any group name, core or custom.
 */
const groups = new Proxy( coreGroups, {
	get( target, name ) {
		if ( typeof name !== 'string' ) {
			return target[ name ];
		}
		if ( ! ( name in target ) ) {
			target[ name ] = createSlotFill( `InspectorControls-${ name }` );
		}
		return target[ name ];
	},
} );

export default groups;

// Private slot for allowed blocks control UI.
export const PrivateInspectorControlsAllowedBlocks = createSlotFill(
	Symbol( 'PrivateInspectorControlsAllowedBlocks' )
);
