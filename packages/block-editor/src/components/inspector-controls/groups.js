/**
 * WordPress dependencies
 */
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
const InspectorControlsDisplay = createSlotFill( 'InspectorControlsDisplay' );
const InspectorControlsMedia = createSlotFill( 'InspectorControlsMedia' );
const InspectorControlsPosition = createSlotFill( 'InspectorControlsPosition' );
const InspectorControlsSettings = createSlotFill( 'InspectorControlsSettings' );
const InspectorControlsTypography = createSlotFill(
	'InspectorControlsTypography'
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
	display: InspectorControlsDisplay,
	effects: InspectorControlsEffects,
	filter: InspectorControlsFilter,
	list: InspectorControlsListView,
	media: InspectorControlsMedia,
	position: InspectorControlsPosition,
	settings: InspectorControlsSettings,
	styles: InspectorControlsStyles,
	typography: InspectorControlsTypography,
};

/**
 * Gets or creates a SlotFill for the given group name.
 * Supports namespaced groups (e.g., 'query/filters') by dynamically creating SlotFills.
 *
 * @param {string} groupName The group name.
 * @return {Object|null} The SlotFill object or null if invalid.
 */
export function getGroup( groupName ) {
	if ( groups[ groupName ] ) {
		return groups[ groupName ];
	}

	// Support namespaced groups for block-specific panels
	if ( groupName && groupName.includes( '/' ) ) {
		if ( ! groups[ groupName ] ) {
			groups[ groupName ] = createSlotFill(
				`InspectorControls/${ groupName }`
			);
		}
		return groups[ groupName ];
	}

	return null;
}

export default groups;

// Private slot for allowed blocks control UI.
export const PrivateInspectorControlsAllowedBlocks = createSlotFill(
	Symbol( 'PrivateInspectorControlsAllowedBlocks' )
);
